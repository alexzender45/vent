const ratingRoute = require("../core/routerConfig");
const ratingController = require("../controller/ratingController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

ratingRoute
  .route("/ratings")
  .post(
    authenticate,
    permit(Object.keys(USER_TYPE.SERVICE_CLIENT)),
    ratingController.create
  );

ratingRoute
  .route("/ratings/:providerId")
  .get(
    authenticate,
    permit(
      Object.keys([USER_TYPE.SERVICE_CLIENT], [USER_TYPE.SERVICE_PROVIDER])
    ),
    ratingController.getAllProviderRating
  );

ratingRoute
  .route("/ratings/:serviceId")
  .get(
    authenticate,
    permit(
      Object.keys([USER_TYPE.SERVICE_CLIENT], [USER_TYPE.SERVICE_PROVIDER])
    ),
    ratingController.getAllServiceRating
  );

module.exports = ratingRoute;
