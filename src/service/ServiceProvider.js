const axios = require('axios');
const { google } = require('googleapis');
const serviceProviderSchema = require('../models/serviceProviderModel');
const Wallet = require('../models/wallet');
const {throwError} = require("../utils/handleErrors");
const bcrypt = require("bcrypt");
const util = require("../utils/util");
const {validateParameters} = require('../utils/util');
const {sendResetPasswordToken, verificationCode, SuccessfulPasswordReset } = require('../utils/sendgrid');
const {getCachedData} = require('./Redis');
const {GOOGLE_CONFIG_CLIENT_ID, GOOGLE_CONFIG_CLIENT_SECRET, GOOGLE_CONFIG_REDIRECT_URI2} = require('../core/config');
const cloud = require("../utils/cloudinaryConfig");

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CONFIG_CLIENT_ID,
    GOOGLE_CONFIG_CLIENT_SECRET,
    GOOGLE_CONFIG_REDIRECT_URI2,
  );

class ServiceProvider {
    constructor(data) {
        this.data = data;
        this.errors = [];
    }

    async emailExist() {
        const existingUser = await serviceProviderSchema.findOne({email: this.data.email}).exec();
        if (existingUser) {
            this.errors.push('Email already exists');
            return {emailExist: true, user: existingUser};
        }
        return {emailExist: false};
    }

    async signup() {
        const otp = this.data.otp;
        if (!otp) {
            throwError('OTP Required To Complete Signup')
        }
        const cachedOTP = await getCachedData(this.data.email);

        if (!cachedOTP) {
            throwError('OTP Code Expired');
        }
        else if (cachedOTP !== otp) {
            throwError('Invalid OTP')
        }

        const serviceProvider = new serviceProviderSchema(this.data);
        let validationError = serviceProvider.validateSync();
        if (validationError) {
            Object.values(validationError.errors).forEach(e => {
                if (e.reason) this.errors.push(e.reason.message);
                else this.errors.push(e.message.replace('Path ', ''));
            });
            throwError(this.errors)
        }
        await Promise.all([this.emailExist()]);
        if (this.errors.length) {
            throwError(this.errors)
        }
        const newServiceProvider = await serviceProvider.save();
        await new Wallet({userId: newServiceProvider._id}).save();
        return newServiceProvider;
    }

    async login() {
        const {loginId, password} = this.data;
        const validParameters = validateParameters(["loginId", "password"], this.data);
        const {isValid, messages} = validParameters;
        if (!isValid) {
            throwError(messages);
        }
        return await serviceProviderSchema.findByCredentials(loginId, password);
    }


    static async getAllServiceProvider() {
        const serviceProviders = await serviceProviderSchema.find();
        return serviceProviders ? serviceProviders : throwError('No Service Provider Found', 404)
    }

    async serviceProviderProfile() {
        const serviceProvider = await serviceProviderSchema.findById(this.data);
        return serviceProvider ? serviceProvider : throwError('Service Provider Not Found', 404)
    }

    async updateServiceProviderDetails() {
        const {newDetails, oldDetails} = this.data;
        const updates = Object.keys(newDetails);
        const allowedUpdates = [
            'email',
            'phoneNumber',
            'location',
            'fullName'
        ];
        return await util.performUpdate(updates, newDetails, allowedUpdates, oldDetails);
    }

    async forgotPassword() {
        const { email } = this.data;
        const verificationCode = Math.floor(100000 + Math.random() * 100000);
        if (!email) {
          throwError("Please Input Your Email");
        }
        const updateServiceProvider = await serviceProviderSchema.findOneAndUpdate(
          { email },
          { token: verificationCode },
          { new: true }
        );
        if (!updateServiceProvider) {
          throwError("Invalid Email");
        }
        await sendResetPasswordToken(
          updateServiceProvider.email,
          updateServiceProvider.firstName,
          updateServiceProvider.token
        );
        return updateServiceProvider;
      }

    async resetPassword() {
        const {token, newPassword} = this.data;
        if (!token || !newPassword) {
            throwError('Please Input Your Token and New Password');
        }
        const updatedPassword = await bcrypt.hash(newPassword, 10);
        const updateServiceProvider = await serviceProviderSchema.findOneAndUpdate(
            {token},
            {token: null, password: updatedPassword},
            {new: true}
        );
        if (!updateServiceProvider) {
            throwError('Invalid Token');
        }
        await SuccessfulPasswordReset(
            updateServiceProvider.fullName,
            updateServiceProvider.email,
        );
        return updateServiceProvider;
    };

    async changePassword() { 
        const { oldPassword, newPassword, userId } = this.data;
        if (!oldPassword || !newPassword) {
          throwError("Please Input Your Old Password and New Password");
        }
        const user = await serviceProviderSchema.findById(userId);
        if (!bcrypt.compareSync(oldPassword, user.password)) {
          throwError("Incorrect Old Password");
        }
        const changedPassword = await bcrypt.hash(newPassword, 10);
        const updateServiceProvider = await serviceProviderSchema.findByIdAndUpdate(
          { _id: userId },
          { password: changedPassword },
          { new: true }
        );
        if (!updateServiceProvider) {
          throwError('Invalid Token');
      }
        return updateServiceProvider;
      }

      // google sign in
      async googleUrl() {
        try {
          const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ].join(' ');

          const googleLoginUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
          });
          return { googleLoginUrl };
        } catch (ex) {
          logger.log({
            level: 'error',
            message: ex.message,
          });
          return { error: ex };
        }
      }
      async getGoogleUserInfo(access_token) {
        try {
          const { data } = await axios({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'get',
            headers: {
              // eslint-disable-next-line camelcase
              Authorization: `Bearer ${access_token}`,
            },
          });
          return data;
        } catch (ex) {
          logger.log({
            level: 'error',
            message: ex.message,
          });
          return { error: ex };
        }
      }

      async googleAccessToken() {
          const code = this.data;
          const tokens = await oauth2Client.getToken(code);

          // eslint-disable-next-line camelcase
          const { access_token } = tokens.tokens;

          // eslint-disable-next-line camelcase
          if (access_token) {
            const {
              // eslint-disable-next-line camelcase
              email, given_name, family_name,
            } = await this.getGoogleUserInfo(access_token);
            if (email) {
              const userExist = await serviceProviderSchema.findOne({ email });
              if (!userExist) {
                const password = await bcrypt.hash(given_name, 10);
                const newUser = await serviceProviderSchema.create({
                  email,
                  password,
                  fullName: `${given_name} ${family_name}`,
                });

                // eslint-disable-next-line no-use-before-define
                return await newUser;
              }
              // eslint-disable-next-line no-use-before-define
              return await userExist;
            }
          }
          return { error: 'Error signing in' };
      }


      async uploadProfileImage() {
        const { originalname, userId, path } = this.data;
        let attempt = {
          imageName: originalname,
          imageUrl: path,
        };
        cloud.uploads(attempt.imageUrl).then(async (result) => {
          const imageUrl = result.url;
          const serviceProvider = await serviceProviderSchema.findByIdAndUpdate(
            { _id: userId },
            { $set: { profilePictureUrl: imageUrl } },
            {
              new: true,
            }
          );
          return serviceProvider;
        });
      }

      // service provider can delete their account
      async deleteAccount() { 
        const { userId } = this.data;
        const serviceProvider = await serviceProviderSchema.findByIdAndRemove({ _id: userId });
        return serviceProvider;
      }

      // get service provider by id
      async getServiceProviderById() {
        const id = this.data;
        const serviceProvider = await serviceProviderSchema.findById(id);
        return serviceProvider;
      }

    // delete service provider by id
    async deleteServiceProviderById() {
      const id = this.data;
      const serviceProvider = await serviceProviderSchema.findByIdAndRemove({ _id: id });
      return serviceProvider;
    }
};

module.exports = ServiceProvider;