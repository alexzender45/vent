const serviceClientRoute = require("../core/routerConfig");
const serviceClientController = require("../controller/serviceClientController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE, ADMIN_ROLES } = require("../utils/constants");
const upload = require("../core/multer");

serviceClientRoute
  .route("/service/clients")
  .post(serviceClientController.signup)
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.serviceClientProfile
  )
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.updateServiceClientDetails
  );

serviceClientRoute
  .route("/service/clients/all")
  .get(
    authenticate,
   //permit([ADMIN_ROLES.SUPER_ADMIN]),
    serviceClientController.getAllServiceClient
  );

serviceClientRoute
  .route("/service/clients/login")
  .post(serviceClientController.login);

serviceClientRoute
  .route("/service/clients/forgot-password")
  .post(serviceClientController.forgotPassword);

serviceClientRoute
  .route("/service/clients/reset-password")
  .post(serviceClientController.resetPassword);

serviceClientRoute
  .route("/service/clients/change-password")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.changePassword
  );

// google sign in
serviceClientRoute
  .route("/service/clients/google-sign-in")
  .get(serviceClientController.googleSignIn);

serviceClientRoute
  .route("/service/clients/access")
  .get(serviceClientController.googleAccessToken);

serviceClientRoute
  .route("/service/clients/facebook-sign-in")
  .get(serviceClientController.initiateFacebookSignIn);

serviceClientRoute
  .route("/service/clients/facebook-authenticate")
  .get(serviceClientController.facebookAuthentication);

// upload profile picture
serviceClientRoute
  .route("/service/clients/upload-profile-picture")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.uploadProfileImage
  );

// service client can delete their account
serviceClientRoute
  .route("/service/clients/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.deleteAccount
  );

// get service client by id
serviceClientRoute
  .route("/service/clients/:id")
  .get(authenticate, serviceClientController.getServiceClientById);

// delete service client by id
serviceClientRoute
  .route("/service/clients/:id/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.deleteServiceClientById
  );

// follow service provider
serviceClientRoute
  .route("/service/providers/:id/follow")
  .get(authenticate, serviceClientController.followUser);

// unfollow service provider
serviceClientRoute
  .route("/service/providers/:id/unfollow")
  .get(authenticate, serviceClientController.unfollowUser);

// save service
serviceClientRoute
  .route("/service/clients/:id/save-service")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.saveService
  );

// get all saved service
serviceClientRoute
  .route("/service/clients/saved/services")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.getSavedServices
  );
// delete saved service
serviceClientRoute
  .route("/service/clients/saved/services/:id")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.deleteSavedService
  );
// get referral statistics
serviceClientRoute
  .route("/service/clients/referral/statistics")
  .get(authenticate, serviceClientController.getReferralStatistic);

// get client followers
serviceClientRoute
  .route("/service/clients/all/followers")
  .get(authenticate, serviceClientController.getClientFollowers);

serviceClientRoute
  .route("/service/clients/all/following")
  .get(authenticate, serviceClientController.getClientFollowing);

module.exports = serviceClientRoute;
