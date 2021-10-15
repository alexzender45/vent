const servicesRoute = require("../core/routerConfig");
const servicesController = require("../controller/servicesController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

servicesRoute
  .route("/services")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    servicesController.create
  );

servicesRoute
  .route("/services/all")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    servicesController.getAllService
  );

servicesRoute
  .route("/services/provider/:userId")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    servicesController.getAllProviderService
  );

servicesRoute
  .route("/services/type/:type")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    servicesController.getServiceByType
  );

servicesRoute
  .route("/services/category/:categoryId")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    servicesController.getServiceByCategory
  );

servicesRoute
  .route("/services/:id")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    servicesController.getServiceById
  )
  .delete(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    servicesController.deleteService
  )
  .put(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    servicesController.updateService
  );

module.exports = servicesRoute;