const serviceProviderRoute = require("../core/routerConfig");
const serviceProviderController = require("../controller/serviceProviderController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE, ADMIN_ROLES } = require("../utils/constants");
const upload = require("../core/multer");

serviceProviderRoute
  .route("/service/providers")
  .post(serviceProviderController.signup)
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.getServiceProviderProfile
  )
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.updateServiceProviderDetails
  );
//TODO Should this be exposed to SERVICE_PROVIDER??
serviceProviderRoute
  .route("/service/providers/all")
  .get(
    authenticate,
    //permit([ADMIN_ROLES.SUPER_ADMIN]),
    serviceProviderController.getAllServiceProvider
  );

serviceProviderRoute
  .route("/service/providers/login")
  .post(serviceProviderController.login);

serviceProviderRoute
  .route("/service/providers/forgot-password")
  .post(serviceProviderController.forgotPassword);

serviceProviderRoute
  .route("/service/providers/reset-password")
  .post(serviceProviderController.resetPassword);

serviceProviderRoute
  .route("/service/providers/change-password")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.changePassword
  );

// google sign in
serviceProviderRoute
  .route("/service/providers/google-sign-in")
  .get(serviceProviderController.googleSignIn);

serviceProviderRoute
  .route("/service/providers/access")
  .get(serviceProviderController.googleAccessToken);

serviceProviderRoute
  .route("/service/providers/facebook-sign-in")
  .get(serviceProviderController.initiateFacebookSignIn);

serviceProviderRoute
  .route("/service/providers/facebook-authenticate")
  .get(serviceProviderController.facebookAuthentication);

// upload profile picture
serviceProviderRoute
  .route("/service/providers/upload-profile-picture")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.uploadProfileImage
  );

// service client can delete their account
serviceProviderRoute
  .route("/service/providers/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.deleteAccount
  );

// get service provider by id
serviceProviderRoute
  .route("/service/providers/:id")
  .get(authenticate, serviceProviderController.getServiceProviderById);

// delete service provider by id
serviceProviderRoute
  .route("/service/providers/:id/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.deleteServiceProviderById
  );

// follow service provider
serviceProviderRoute
  .route("/service/clients/:id/follow")
  .get(authenticate, serviceProviderController.followUser);

// unfollow service provider
serviceProviderRoute
  .route("/service/clients/:id/unfollow")
  .get(authenticate, serviceProviderController.unfollowUser);

// get referral statistics
serviceProviderRoute
  .route("/service/providers/referral/statistics")
  .get(authenticate, serviceProviderController.getReferralStatistic);

// get provider followers
serviceProviderRoute
  .route("/service/providers/all/followers")
  .get(authenticate, serviceProviderController.getProviderFollowers);

serviceProviderRoute
  .route("/service/providers/all/following")
  .get(authenticate, serviceProviderController.getProviderFollowing);

serviceProviderRoute
  .route("/service/providers/profile/percentage")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    serviceProviderController.providerProfileCompletePercentage
  );

module.exports = serviceProviderRoute;
