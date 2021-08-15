const serviceClientRoute = require("../core/routerConfig");
const serviceClientController = require("../controller/serviceClientController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");
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
    permit([USER_TYPE.SERVICE_CLIENT]),
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

// upload profile picture
serviceClientRoute
  .route("/service/clients/upload-profile-picture")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    upload.imageUpload.any(),
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
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.getServiceClientById
  );

// delete service client by id
serviceClientRoute
  .route("/service/clients/:id/delete")
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    serviceClientController.deleteServiceClientById
  );

module.exports = serviceClientRoute;
