const axios = require("axios");
const { google } = require("googleapis");
const serviceProviderSchema = require("../models/serviceProviderModel");
const serviceClientSchema = require("../models/serviceClientModel");
const orderSchema = require("../models/orderModel");
const walletSchema = require("../models/wallet");
const Wallet = require("./Wallet");
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
  GOOGLE_CONFIG_REDIRECT_URI2,
} = require("../core/config");
const cloud = require("../utils/cloudinaryConfig");

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CONFIG_CLIENT_ID,
  GOOGLE_CONFIG_CLIENT_SECRET,
  GOOGLE_CONFIG_REDIRECT_URI2
);
const { ACCOUNT_TYPE } = require("../utils/constants");
const socialAuthService = require("../integration/socialAuthClient");
const PROVIDERS = "providers";
const Notification = require("./Notification");
const Order = require("./Order");
const {
  ORDER_STATUS,
  NOTIFICATION_TYPE,
  SERVICE_TYPE,
  USER_TYPE,
} = require("../utils/constants");
const Services = require("./Services");
const { io } = require("socket.io-client");
const socket = io("http://localhost:3000");

const getProviderServicesStatistics = async (serviceProvider) => {
  let activeServices = 0;
  let completedServices = 0;
  let totalAmountReceived = 0;

  await orderSchema
    .find({ providerId: serviceProvider._id })
    .then((providerOrders) => {
      providerOrders.forEach((providerOrder) => {
        switch (providerOrder.status) {
          case ORDER_STATUS.ACCEPTED:
            activeServices++;
            break;
          case ORDER_STATUS.COMPLETED:
            completedServices++;
            totalAmountReceived += providerOrder.price;
            break;
          case ORDER_STATUS.PAID:
            totalAmountReceived += providerOrder.price;
            break;
        }
      });
    })
    .catch((error) => console.debug(error));

  serviceProvider["activeServices"] = activeServices;
  serviceProvider["completedServices"] = completedServices;
  serviceProvider["totalAmountReceived"] = totalAmountReceived;

  const providerServices = await new Services({
    userId: serviceProvider._id,
  }).getAllUserServices();
  const serviceTypes = new Map();

  providerServices.forEach((providerService) => {
    const serviceType = providerService.type;
    const existingServiceType = serviceTypes.get(serviceType);
    existingServiceType
      ? serviceTypes.set(serviceType, existingServiceType + 1)
      : serviceTypes.set(serviceType, 1);
  });

  const onlineServices = serviceTypes.get(SERVICE_TYPE.ONLINE) || 0;
  const bookedServices = serviceTypes.get(SERVICE_TYPE.BOOKING) || 0;
  const requestedServices = serviceTypes.get(SERVICE_TYPE.REQUESTING) || 0;

  serviceProvider["allServices"] = providerServices.length;
  serviceProvider["onlineServices"] = onlineServices;
  serviceProvider["bookedServices"] = bookedServices;
  serviceProvider["requestedServices"] = requestedServices;
};

class ServiceProvider {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async emailExist() {
    const existingUser = await serviceProviderSchema
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
    const serviceProvider = new serviceProviderSchema(this.data);
    const newServiceProvider = await serviceProvider.save();
    await new walletSchema({userId: newServiceProvider._id}).save();
    if (
      this.data.referralIdentity !== undefined ||
      this.data.referralIdentity !== null
    ) {
      const clientReferral = await serviceClientSchema.findOne({
        email: this.data.referralIdentity,
      });
      if (clientReferral) {
        const referralDetails = {
          userId: newServiceProvider._id,
          userType: newServiceProvider.userType,
          name: newServiceProvider.fullName,
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
            userId: newServiceProvider._id,
            userType: newServiceProvider.userType,
            name: newServiceProvider.fullName,
            paid: false,
          };
          providerReferral.referrals.push(referralDetails);
          providerReferral.save();
        }
      }
    }
    return newServiceProvider;
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
    const provider = await serviceProviderSchema.findByCredentials(loginId, password);
    if(firebaseToken){
      provider.firebaseToken = firebaseToken;
      await provider.save();
    }
      return provider;
  }

  static async getAllServiceProvider() {
    return await serviceProviderSchema
      .find()
      .orFail(() => throwError("No Service Provider Found", 404));
  }

  async serviceProviderProfile() {
    const { _doc } = await serviceProviderSchema.findOneAndUpdate(
      { _id: this.data },
      { $inc: { visitCount: 1 } },
      { new: true }
    );
    const providerServices = await new Services({
      userId: _doc._id,
    }).getServiceByUser();
    if (providerServices.length > 0) {
      const stats = getProviderServicesStatistics(_doc);
      const userWallet = await walletSchema.findOne({ userId: _doc._id });
      await Promise.all([stats, userWallet]).then((results) => {
        if(results[1]){
        const { currentBalance } = results[1];
        _doc["walletBalance"] = currentBalance;
        }
      });
    }
    return _doc;
  }

  async updateServiceProviderDetails() {
    const { newDetails, oldDetails } = this.data;
    const allowedUpdates = [
      "dateOfBirth",
      "bio",
      "location",
      "gender",
      "fullName",
      "email",
      "occupation",
      "presence",
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
    const updateServiceProvider = await serviceProviderSchema.findOneAndUpdate(
      { email: removeWhiteSpace },
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
    const { token, newPassword } = this.data;
    if (!token || !newPassword) {
      throwError("Please Input Your Token and New Password");
    }
    const updatedPassword = await bcrypt.hash(newPassword, 10);
    const updateServiceProvider = await serviceProviderSchema.findOneAndUpdate(
      { token },
      { token: null, password: updatedPassword },
      { new: true }
    );
    if (!updateServiceProvider) {
      throwError("Invalid Token");
    }
    await SuccessfulPasswordReset(
      updateServiceProvider.fullName,
      updateServiceProvider.email
    );
    return updateServiceProvider;
  }

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
      throwError("Invalid Token");
    }
    return updateServiceProvider;
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
        const userExist = await serviceProviderSchema.findOne({ email });
        if (!userExist) {
          const newUser = await serviceProviderSchema.create({
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
    const serviceProvider = await serviceProviderSchema.findByIdAndUpdate(
      { _id: userId },
      { $set: { profilePictureUrl: imageUrl } },
      {
        new: true,
      }
    );
    return serviceProvider;
  }

  // service provider can delete their account
  async deleteAccount() {
    const { userId } = this.data;
    const serviceProvider = await serviceProviderSchema.findByIdAndRemove({
      _id: userId,
    });
    return serviceProvider;
  }

  // get service provider by id
  async getServiceProviderById() {
    const id = this.data;
    const { _doc } = await serviceProviderSchema.findOneAndUpdate(
      { _id: id },
      { $inc: { visitCount: 1 } },
      { new: true }
    );
    const providerServices = await new Services({
      userId: _doc._id,
    }).getServiceByUser();
    if (providerServices.length > 0) {
      const stats = getProviderServicesStatistics(_doc);
      const userWallet = await walletSchema.findOne({ userId: _doc._id });
      await Promise.all([stats, userWallet]).then((results) => {
        if(results[1]){
        const { currentBalance } = results[1];
        _doc["walletBalance"] = currentBalance;
        }
      });
    }
    return _doc;
  }

  // delete service provider by id
  async deleteServiceProviderById() {
    const id = this.data;
    const serviceProvider = await serviceProviderSchema.findByIdAndRemove({
      _id: id,
    });
    return serviceProvider;
  }

  static getFacebookSignInUrl() {
    return socialAuthService.getFacebookSignInUrl(PROVIDERS);
  }

  async processFacebookSignIn() {
    const accessToken = await socialAuthService.getFacebookAccessToken(
      this.data,
      PROVIDERS
    );
    const { email, first_name, last_name, gender } =
      await socialAuthService.getFacebookUserData(accessToken);
    if (email) {
      let user = await serviceProviderSchema.findOne({ email });
      if (!user) {
        user = await serviceProviderSchema.create({
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
    const user = await serviceClientSchema
      .findById({
        _id: followedUserId,
      })
      .orFail(() => throwError("User To Be Followed Not Found", 404));
    const follower = await serviceProviderSchema
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
    const user = await serviceClientSchema
      .findOne({
        _id: followedUserId,
      })
      .orFail(() => throwError("User To Be Unfollowed Not Found", 404));
    const follower = await serviceProviderSchema
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

  static async updateCommunityRating(userId, rating) {
    return await serviceProviderSchema.findOneAndUpdate(
      { _id: userId },
      { communityRating: rating },
      { new: true }
    );
  }
  async getReferralStatistics() {
    const user = await serviceProviderSchema
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

  async getProviderFollowers() {
    const serviceProvider = await serviceProviderSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const followers = await serviceClientSchema
      .find({
        _id: { $in: serviceProvider.followers },
      })
      .populate("userId", "fullName profilePictureUrl")
    return followers;
  }

  async getProviderFollowing() {
    const serviceProvider = await serviceProviderSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const following = await serviceClientSchema
      .find({
        _id: { $in: serviceProvider.following },
      })
      .populate("userId", "fullName profilePictureUrl")
    return following;
  }
  async updateProviderCurrentReferralBalance() {
    const { userId, currentReferralBalance } = this.data;
    return await serviceProviderSchema.findByIdAndUpdate(
      { _id: userId },
      {
        currentReferralBalance: currentReferralBalance,
      },
      {
        new: true,
      }
    );
  }

  async providerProfileCompletePercentage() {
    const serviceProvider = await serviceProviderSchema
      .findById(this.data)
      .orFail(() => throwError("User Not Found", 404));
    const profileCompletePercentage = {
      profileCompletePercentage: 0,
      profileCompletePercentageMessage: "",
    };
    if (serviceProvider.profilePictureUrl) {
      profileCompletePercentage.profileCompletePercentage += 14;
    }
    if (serviceProvider.dateOfBirth) {
      profileCompletePercentage.profileCompletePercentage += 14;
    }
    if (serviceProvider.phoneNumber) {
      profileCompletePercentage.profileCompletePercentage += 14;
    }
    if (serviceProvider.location) {
      profileCompletePercentage.profileCompletePercentage += 15;
    }
    if (serviceProvider.occupation) {
      profileCompletePercentage.profileCompletePercentage += 14;
    }
    if (serviceProvider.bio) {
      profileCompletePercentage.profileCompletePercentage += 14;
    }
    if (serviceProvider.gender) {
      profileCompletePercentage.profileCompletePercentage += 15;
    }
    if (serviceProvider.profileCompletePercentage === 100) {
      profileCompletePercentage.profileCompletePercentageMessage =
        "Your Profile is 100% Complete";
    } else {
      profileCompletePercentage.profileCompletePercentageMessage =
        "Your Profile is " +
        profileCompletePercentage.profileCompletePercentage +
        "% Complete";
    }
    return profileCompletePercentage;
  }
  async getProviderByIdChat() {
    const serviceProvider = await serviceProviderSchema
      .findById(this.data)
      .sort('-createdAt')
    return serviceProvider;
  }

  async updateProviderIsOnline(email, isOnline, socketId) {
    return await serviceProviderSchema.findOneAndUpdate({
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

module.exports = ServiceProvider;
