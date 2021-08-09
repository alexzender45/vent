const serviceClientSchema = require('../models/serviceClientModel');
const Wallet = require('../models/wallet');
const {throwError} = require("../utils/handleErrors");
const bcrypt = require("bcrypt");
const util = require("../utils/util");
const {validateParameters} = require('../utils/util');
const {sendResetPasswordToken, verificationCode, SuccessfulPasswordReset } = require('../utils/sendgrid');
const {getCachedData} = require('./Redis');

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

    async phoneNumberExist() {
        const findPhoneNumber = await serviceClientSchema.findOne({phoneNumber: this.data.phoneNumber}).exec();
        if (findPhoneNumber) {
            this.errors.push('Phone Number already exists');
            return true;
        }
        return false;
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
        await Promise.all([this.emailExist(), this.phoneNumberExist()]);
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

      // signup service client with google 
};

module.exports = ServiceClient;