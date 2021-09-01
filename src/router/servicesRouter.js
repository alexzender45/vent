const servicesRoute = require("../core/routerConfig");
const servicesController = require("../controller/servicesController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

servicesRoute
    .route("/services")
    .post(
        authenticate,
        permit(USER_TYPE.SERVICE_PROVIDER),
        servicesController.create
    );

servicesRoute
    .route("/services/:userId")
    .get(
        authenticate,
        permit(Object.keys(USER_TYPE)),
        servicesController.getAllUserService
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
        permit(USER_TYPE.SERVICE_PROVIDER),
        servicesController.deleteService
    );

servicesRoute
    .route("/services/:type")
    .get(
        authenticate,
        permit(Object.keys(USER_TYPE)),
        servicesController.getServiceByType
    );

module.exports = servicesRoute;