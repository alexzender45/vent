const ratingRoute = require("../core/routerConfig");
const ratingController = require("../controller/ratingController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

ratingRoute
  .route("/ratings/:orderId")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    ratingController.createRating
  );

ratingRoute
  .route("/ratings/:providerId/provider-ratings")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT], [USER_TYPE.SERVICE_PROVIDER]),
    ratingController.getAllProviderRating
  );

ratingRoute
  .route("/ratings/:serviceId/service-ratings")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT], [USER_TYPE.SERVICE_PROVIDER]),
    ratingController.getAllServiceRating
  );

module.exports = ratingRoute;
