const axios = require("axios");
const { google } = require("googleapis");
const serviceClientSchema = require("../models/serviceClientModel");
const serviceProviderSchema = require("../models/serviceProviderModel");
const serviceSchema = require("../models/servicesModel");
const orderSchema = require("../models/orderModel");
const { throwError } = require("../utils/handleErrors");
const bcrypt = require("bcrypt");
const util = require("../utils/util");
const { validateParameters } = require("../utils/util");
const {
  sendResetPasswordToken,
  verificationCode,
  SuccessfulPasswordReset,
  sendSuccessfulRegistrationEmail,
} = require("../utils/sendgrid");
const { getCachedData } = require("./Redis");
const {
  GOOGLE_CONFIG_CLIENT_ID,
  GOOGLE_CONFIG_CLIENT_SECRET,
  GOOGLE_CONFIG_REDIRECT_URI,
  REFERRAL_PERCENTAGE,
} = require("../core/config");
const cloud = require("../utils/cloudinaryConfig");
const {
  ACCOUNT_TYPE,
  NOTIFICATION_TYPE,
  USER_TYPE,
} = require("../utils/constants");
const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CONFIG_CLIENT_ID,
  GOOGLE_CONFIG_CLIENT_SECRET,
  GOOGLE_CONFIG_REDIRECT_URI
);
const socialAuthService = require("../integration/socialAuthClient");
const CLIENTS = "clients";
const Order = require("./Order");
const { ORDER_STATUS } = require("../utils/constants");
const Notification = require("./Notification");

const getClientOrdersStatistics = async (serviceClient) => {
  let activeOrders = 0;
  let failedOrders = 0;
  let completedOrders = 0;
  let allOrders = 0;
  let totalAmountSpent = 0;

  await orderSchema
    .find({ clientId: serviceClient._id })
    .then((clientOrders) => {
      clientOrders.forEach((clientOrder) => {
        allOrders++;
        switch (clientOrder.status) {
          case ORDER_STATUS.CANCELLED:
            failedOrders++;
            break;
          case ORDER_STATUS.ACCEPTED:
            activeOrders++;
            break;
          case ORDER_STATUS.COMPLETED:
            completedOrders++;
            totalAmountSpent += clientOrder.price;
            break;
          case ORDER_STATUS.PAID:
            totalAmountSpent += clientOrder.price;
            break;
        }
      });
    })
    .catch((error) => console.debug(error));

  serviceClient["allOrders"] = allOrders;
  serviceClient["failedOrders"] = failedOrders;
  serviceClient["activeOrders"] = activeOrders;
  serviceClient["completedOrders"] = completedOrders;
  serviceClient["totalAmountSpent"] = totalAmountSpent;
};

class ServiceClient {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async emailExist() {
    const existingUser = await serviceClientSchema
      .findOne({ email: this.data.email })
      .exec();
    if (existingUser) {
      throwError("Email Already Exist", 301);
      return { emailExist: true, user: existingUser };
    }
    return { emailExist: false };
  }

  async signup() {
    const { isValid, messages } = validateParameters(
      ["fullName", "email", "otp"],
      this.data
    );
    if (!isValid) {
      throwError(messages);
    }
    const otp = this.data.otp;
    if (!otp) {
      throwError("OTP Required To Complete Signup");
    }
    const email = this.data.email;
    const removeWhiteSpace = email.replace(/\s+/g, " ").trim();
    const cachedOTP = await getCachedData(removeWhiteSpace);
    const removeWhiteSpaceOTP = otp.replace(/\s+/g, " ").trim();
    if (!cachedOTP) {
      throwError("OTP Code Expired");
    } else if (Number(cachedOTP) !== Number(removeWhiteSpaceOTP)) {
      throwError("Invalid OTP");
    }
    await this.emailExist();
    if (this.errors.length) {
      throwError(this.errors);
    }
    const serviceClient = new serviceClientSchema(this.data);
    const newServiceClient = await serviceClient.save();
    if (
      this.data.referralIdentity !== undefined ||
      this.data.referralIdentity !== null
    ) {
      const clientReferral = await serviceClientSchema.findOne({
        email: this.data.referralIdentity,
      });
      if (clientReferral) {
        const referralDetails = {
          userId: newServiceClient._id,
          userType: newServiceClient.userType,
          name: newServiceClient.fullName,
          paid: false,
        };
        clientReferral.referrals.push(referralDetails);
        clientReferral.save();
      } else if (clientReferral === null || clientReferral === undefined) {
        const providerReferral = await serviceProviderSchema.findOne({
          email: this.data.referralIdentity,
        });
        if (providerReferral) {
          const referralDetails = {
            userId: newServiceClient._id,
            userType: newServiceClient.userType,
            name: newServiceClient.fullName,
            paid: false,
          };
          providerReferral.referrals.push(referralDetails);
          providerReferral.save();
        }
      }
    }
    return newServiceClient;
  }

  async login() {
    let { loginId, password, firebaseToken } = this.data;
    loginId = loginId.replace(/\s+/g, " ").trim();
    const validParameters = validateParameters(
      ["loginId", "password"],
      this.data
    );
    const { isValid, messages } = validParameters;
    if (!isValid) {
      throwError(messages);
    }
    const serviceClient = await serviceClientSchema.findByCredentials(loginId, password);
    if(firebaseToken){
      serviceClient.firebaseToken = firebaseToken;
      await serviceClient.save();
    }
    return serviceClient;
  }

  async getAllServiceClient() {
    const serviceClient = await serviceClientSchema.find();
    return serviceClient
      ? serviceClient
      : throwError("No Service Client Found", 404);
  }

  async serviceClientProfile() {
    const { _doc } = await serviceClientSchema
      .findById(this.data)
      .orFail(() => throwError("Service Client Not Found", 404));
    const clientOrders = await orderSchema.find({ clientId: _doc._id });
    if (clientOrders.length > 0) {
      await getClientOrdersStatistics(_doc);
    }
    return _doc;
  }

  async updateServiceClientDetails() {
    const { newDetails, oldDetails } = this.data;
    const allowedUpdates = [
      "dateOfBirth",
      "bio",
      "location",
      "gender",
      "fullName",
      "email",
      "presence",
      "occupation",
      "phoneNumber",
    ];
    return await util.performUpdate(newDetails, allowedUpdates, oldDetails);
  }

  async forgotPassword() {
    const { email } = this.data;
    const removeWhiteSpace = email.replace(/\s+/g, " ").trim();
    const verificationCode = Math.floor(100000 + Math.random() * 100000);
    if (!email) {
      throwError("Please Input Your Email");
    }
    const updateServiceClient = await serviceClientSchema.findOneAndUpdate(
      { email: removeWhiteSpace },
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
    const { token, newPassword } = this.data;
    if (!token || !newPassword) {
      throwError("Please Input Your Token and New Password");
    }
    const updatedPassword = await bcrypt.hash(newPassword, 10);
    const updateServiceClient = await serviceClientSchema.findOneAndUpdate(
      { token },
      { token: null, password: updatedPassword },
      { new: true }
    );
    if (!updateServiceClient) {
      throwError("Invalid Token");
    }
    await SuccessfulPasswordReset(
      updateServiceClient.fullName,
      updateServiceClient.email
    );
    return updateServiceClient;
  }

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
      throwError("Invalid Token");
    }
    return updateServiceClient;
  }

  // google sign in
  async googleUrl() {
    try {
      const scopes = [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/user.gender.read",
      ].join(" ");

      const googleLoginUrl = oauth2Client.generateAuthUrl({
        access_type: "offline",
        scope: scopes,
      });
      return { googleLoginUrl };
    } catch (ex) {
      logger.log({
        level: "error",
        message: ex.message,
      });
      return { error: ex };
    }
  }
  async getGoogleUserInfo(access_token) {
    try {
      const { data } = await axios({
        url: "https://www.googleapis.com/oauth2/v2/userinfo",
        method: "get",
        headers: {
          // eslint-disable-next-line camelcase
          Authorization: `Bearer ${access_token}`,
        },
      });
      return data;
    } catch (ex) {
      logger.log({
        level: "error",
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
        email,
        given_name,
        family_name,
      } = await this.getGoogleUserInfo(access_token);
      if (email) {
        const userExist = await serviceClientSchema.findOne({ email });
        if (!userExist) {
          const newUser = await serviceClientSchema.create({
            email,
            fullName: `${given_name} ${family_name}`,
            accountType: ACCOUNT_TYPE.GOOGLE_ACCOUNT,
          });

          // eslint-disable-next-line no-use-before-define
          await sendSuccessfulRegistrationEmail(
            newUser.email,
            newUser.fullName
          );
          return await newUser;
        }
        // eslint-disable-next-line no-use-before-define
        return await userExist;
      }
    }
    return { error: "Error signing in" };
  }

  async uploadProfileImage() {
    const { userId, imageUrl } = this.data;
    const serviceClient = await serviceClientSchema.findByIdAndUpdate(
      { _id: userId },
      { $set: { profilePictureUrl: imageUrl } },
      {
        new: true,
      }
    );
    return serviceClient;
  }

  // service client can delete their account
  async deleteAccount() {
    const { userId } = this.data;
    const serviceClient = await serviceClientSchema.findByIdAndRemove({
      _id: userId,
    });
    return serviceClient;
  }

  // get service client by id
  async getServiceClientById() {
    const { _doc } = await serviceClientSchema
      .findById(this.data)
      .orFail(() => throwError("Service Client Not Found", 404));
    const clientOrders = await orderSchema.find({ clientId: _doc._id });
    if (clientOrders.length > 0) {
      await getClientOrdersStatistics(_doc);
    }
    return _doc;
  } 

  // delete service client by id
  async deleteServiceClientById() {
    const id = this.data;
    const serviceClient = await serviceClientSchema.findByIdAndRemove({
      _id: id,
    });
    return serviceClient;
  }

  static getFacebookSignInUrl() {
    return socialAuthService.getFacebookSignInUrl(CLIENTS);
  }

  async processFacebookSignIn() {
    const accessToken = await socialAuthService.getFacebookAccessToken(
      this.data,
      CLIENTS
    );
    const { email, first_name, last_name, gender } =
      await socialAuthService.getFacebookUserData(accessToken);
    if (email) {
      let user = await serviceClientSchema.findOne({ email });
      if (!user) {
        user = await serviceClientSchema.create({
          email,
          fullName: `${first_name} ${last_name}`,
          gender: gender.toUpperCase(),
          accountType: ACCOUNT_TYPE.FACEBOOK_ACCOUNT,
        });
      }
      return user;
    }
    throwError("Error signing in");
  }

  async followUser() {
    const { userId, followedUserId } = this.data;
    const user = await serviceProviderSchema
      .findById({
        _id: followedUserId,
      })
      .orFail(() => throwError("User To Be Followed Not Found", 404));
    const follower = await serviceClientSchema
      .findById({
        _id: userId,
      })
      .orFail(() => throwError("Follower Not Found", 404));
    follower.following.map((followingId) => {
      if (followingId.toString() === user._id.toString()) {
        throwError("Already Following User");
      }
    });
    user.followers.push(follower._id);
    await user.save();
    follower.following.push(user._id);
    const followerNotificationDetails = {
      userId: follower._id,
      message: `You Started Following ${user.fullName}`,
      image: user.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.FOLLOW_REQUEST,
    };
    Notification.createNotification(followerNotificationDetails);
    const followingNotificationDetails = {
      userId: user._id,
      message: `${follower.fullName} Started Following You`,
      image: follower.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.FOLLOW_REQUEST,
    };
    Notification.createNotification(followingNotificationDetails);
    return await follower.save();
  }

  async unfollowUser() {
    const { followedUserId, userId } = this.data;
    const user = await serviceProviderSchema
      .findOne({
        _id: followedUserId,
      })
      .orFail(() => throwError("User To Be Unfollowed Not Found", 404));
    const follower = await serviceClientSchema
      .findOne({
        _id: userId,
      })
      .orFail(() => throwError("Follower Not Found", 404));
    if (follower.following.length === 0) {
      throwError("You're not following anyone");
    }
    let followingUserIndex = null;
    let followerIndex = null;
    follower.following.map((followingId, index) => {
      if (followingId.toString() === user._id.toString()) {
        followingUserIndex = index;
      }
    });
    if (followingUserIndex === null) {
      throwError("User Is Not Being Followed");
    }
    follower.following.splice(followingUserIndex, 1);
    const updatedUser = await follower.save();
    user.followers.map((followerId, index) => {
      if (followerId.toString() === follower._id.toString()) {
        followerIndex = index;
      }
    });
    user.followers.splice(followerIndex, 1);
    const followerNotificationDetails = {
      userId: follower._id,
      message: `You unfollowed ${user.fullName}`,
      image: user.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.UNFOLLOW_REQUEST,
    };
    Notification.createNotification(followerNotificationDetails);
    const followingNotificationDetails = {
      userId: user._id,
      message: `${follower.fullName} Unfollowed You`,
      image: follower.profilePictureUrl,
      notificationType: NOTIFICATION_TYPE.UNFOLLOW_REQUEST,
    };
    Notification.createNotification(followingNotificationDetails);
    await user.save();
    return updatedUser;
  }

  // saved service
  async saveService() {
    const { userId, serviceId } = this.data;
    const user = await serviceClientSchema
      .findById({
        _id: userId,
      })
      .orFail(() => throwError("User Not Found", 404));
    const service = await serviceSchema
      .findById({
        _id: serviceId,
      })
      .orFail(() => throwError("Service Not Found", 404));
    if (user.savedServices.includes(service._id)) {
      throwError("Service Already Saved");
    }
    user.savedServices.push(service._id);
    await user.save();
    return user;
  }

  async getSavedServices() {
    const user = await serviceClientSchema
      .findById({
        _id: this.data,
      })
      .orFail(() => throwError("User Not Found", 404));
    const savedServices = await serviceSchema
      .find({
        _id: {
          $in: user.savedServices,
        },
      })
      .populate("userId", "fullName profilePictureUrl");
    return savedServices;
  }

  // delete saved service
  async deleteSavedService() {
    const { userId, serviceId } = this.data;
    const user = await serviceClientSchema
      .findById({
        _id: userId,
      })
      .orFail(() => throwError("User Not Found", 404));
    if(user && user.savedServices.includes(serviceId)) {
      user.savedServices.splice(user.savedServices.indexOf(serviceId), 1);
      await user.save();
      return user;
    }
    throwError("Service Not Found");
  }

  async getReferralStatistics() {
    const user = await serviceClientSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const referralDetails = {
      totalReferral: user.referrals.length,
      totalProvidersReferred: 0,
      totalClientsReferred: 0,
      totalReferralEarned: user.totalReferralEarnings,
      currentReferralEarned: user.currentReferralBalance,
    };
    user.referrals.map((referral) => {
      if (referral.userType === USER_TYPE.SERVICE_PROVIDER) {
        referralDetails.totalProvidersReferred++;
      } else {
        referralDetails.totalClientsReferred++;
      }
    });
    return referralDetails;
  }

  async getClientFollowers() {
    const user = await serviceClientSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const followers = await serviceProviderSchema
      .find({
        _id: {
          $in: user.followers,
        },
      })
      .populate("userId", "fullName profilePictureUrl")
    return followers;
  }
  async getClientFollowing() {
    const user = await serviceClientSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const following = await serviceProviderSchema
      .find({
        _id: {
          $in: user.following,
        },
      })
      .populate("userId", "fullName profilePictureUrl")
    return following;
  }
  // update byy id
  async updateUserCurrentReferralBalance() {
    const { userId, currentReferralBalance } = this.data;
    return await serviceClientSchema.findByIdAndUpdate(
      { _id: userId },
      {
        currentReferralBalance: currentReferralBalance,
      },
      {
        new: true,
      }
    );
  }
  // get by id
  async getClientByIdChat() {
    const user = await serviceClientSchema
      .findById(this.data)
      .sort('-createdAt')
    return user;
  }

  async updateClientIsOnline(email, isOnline, socketId) {
    return await serviceClientSchema.findOneAndUpdate({
      $or: [
        { email },
        { socketId },
      ],
    }, 
      {
        $set: { isOnline, socketId },
      },
      {
        new: true,
      }
    );
  }
}

module.exports = ServiceClient;
