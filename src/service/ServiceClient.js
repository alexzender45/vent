const axios = require('axios');
const { google } = require('googleapis');
const serviceClientSchema = require('../models/serviceClientModel');
const Wallet = require('../models/wallet');
const {throwError} = require("../utils/handleErrors");
const bcrypt = require("bcrypt");
const util = require("../utils/util");
const {validateParameters} = require('../utils/util');
const {sendResetPasswordToken, verificationCode, SuccessfulPasswordReset} = require('../utils/sendgrid');
const {getCachedData} = require('./Redis');
const {GOOGLE_CONFIG_CLIENT_ID, GOOGLE_CONFIG_CLIENT_SECRET, GOOGLE_CONFIG_REDIRECT_URI} = require('../core/config');
const cloud = require("../utils/cloudinaryConfig");
const {ACCOUNT_TYPE} = require('../utils/constants');
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CONFIG_CLIENT_ID,
  GOOGLE_CONFIG_CLIENT_SECRET,
  GOOGLE_CONFIG_REDIRECT_URI,
);
const socialAuthService = require('../integration/socialAuthClient');
const CLIENTS = 'clients';

class ServiceClient {
    constructor(data) {
        this.data = data;
        this.errors = [];
    }

    async emailExist() {
        const existingUser = await serviceClientSchema.findOne({email: this.data.email}).exec();
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

        const serviceClient = new serviceClientSchema(this.data);
        let validationError = serviceClient.validateSync();
        if (validationError) {
            Object.values(validationError.errors).forEach(e => {
                if (e.reason) this.errors.push(e.reason.message);
                else this.errors.push(e.message.replace('Path ', ''));
            });
            throwError(this.errors)
        }
        await this.emailExist();
        if (this.errors.length) {
            throwError(this.errors)
        }
        const newServiceClient = await serviceClient.save();
        await new Wallet({userId: newServiceClient._id}).save();
        return newServiceClient;
    }

    async login() {
        const {loginId, password} = this.data;
        const validParameters = validateParameters(["loginId", "password"], this.data);
        const {isValid, messages} = validParameters;
        if (!isValid) {
            throwError(messages);
        }
        return await serviceClientSchema.findByCredentials(loginId, password);
    }


    static async getAllServiceClient() {
        const serviceClient = await serviceClientSchema.find();
        return serviceClient ? serviceClient : throwError('No Service Client Found', 404)
    }

    async serviceClientProfile() {
        const serviceClient = await serviceClientSchema.findById(this.data);
        return serviceClient ? serviceClient : throwError('Service Client Not Found', 404)
    }

    async updateServiceClientDetails() {
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
        const updateServiceClient = await serviceClientSchema.findOneAndUpdate(
          { email },
          { token: verificationCode },
          { new: true }
        );
        if (!updateServiceClient) {
          throwError("Invalid Email");
        }
        await sendResetPasswordToken(
          updateServiceClient.email,
          updateServiceClient.firstName,
          updateServiceClient.token
        );
        return updateServiceClient;
      }

    async resetPassword() {
        const {token, newPassword} = this.data;
        if (!token || !newPassword) {
            throwError('Please Input Your Token and New Password');
        }
        const updatedPassword = await bcrypt.hash(newPassword, 10);
        const updateServiceClient = await serviceClientSchema.findOneAndUpdate(
            {token},
            {token: null, password: updatedPassword},
            {new: true}
        );
        if (!updateServiceClient) {
            throwError('Invalid Token');
        }
        await SuccessfulPasswordReset(
            updateServiceClient.fullName,
            updateServiceClient.email,
        );
        return updateServiceClient;
    };

    async changePassword() { 
        const { oldPassword, newPassword, userId } = this.data;
        if (!oldPassword || !newPassword) {
          throwError("Please Input Your Old Password and New Password");
        }
        const user = await serviceClientSchema.findById(userId);
        if (!bcrypt.compareSync(oldPassword, user.password)) {
          throwError("Incorrect Old Password");
        }
        const changedPassword = await bcrypt.hash(newPassword, 10);
        const updateServiceClient = await serviceClientSchema.findByIdAndUpdate(
          { _id: userId },
          { password: changedPassword },
          { new: true }
        );
        if (!updateServiceClient) {
          throwError('Invalid Token');
      }
        return updateServiceClient;
      }

      // google sign in
      async googleUrl() {
        try {
          const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
            'https://www.googleapis.com/auth/user.gender.read',
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
              const userExist = await serviceClientSchema.findOne({ email });
              if (!userExist) {
                const newUser = await serviceClientSchema.create({
                  email,
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
          const serviceClient = await serviceClientSchema.findByIdAndUpdate(
            { _id: userId },
            { $set: { profilePictureUrl: imageUrl } },
            {
              new: true,
            }
          );
          return serviceClient;
        });
      }

      // service client can delete their account
      async deleteAccount() {
        const { userId } = this.data;
        const serviceClient = await serviceClientSchema.findByIdAndRemove(
         { _id: userId },
        );
        return serviceClient;
      }

     // get service client by id
     async getServiceClientById() {
       const id = this.data;
       const serviceClient = await serviceClientSchema.findById(id);
       return serviceClient;
     }

     // delete service client by id
     async deleteServiceClientById() {
       const id = this.data;
       const serviceClient = await serviceClientSchema.findByIdAndRemove(
         { _id: id },
       );
       return serviceClient;
     }

    static getFacebookSignInUrl() {
        return socialAuthService.getFacebookSignInUrl(CLIENTS);
    }

    async getFacebookAccessToken() {
        const accessToken = await socialAuthService.getFacebookAccessToken(this.data, CLIENTS);
        const { email, first_name, last_name, gender } = await socialAuthService.getFacebookUserData(accessToken);
        if (email) {
            let user = await serviceClientSchema.findOne({ email });
            if (!user) {
                user = await serviceClientSchema.create({
                    email,
                    fullName: `${first_name} ${last_name}`,
                    gender: gender.toUpperCase(),
                    accountType: ACCOUNT_TYPE.FACEBOOK_ACCOUNT
                });
            }
            return user;
        }
        throwError('Error signing in');
    }
};

module.exports = ServiceClient;