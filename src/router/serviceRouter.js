const serviceRoute = require("../core/routerConfig");
const serviceController = require("../controller/serviceController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

serviceRoute
    .route("/services")
    .post(
        authenticate,
        permit(USER_TYPE.SERVICE_PROVIDER),
        serviceController.create
    );

serviceRoute
    .route("/services/:userId")
    .get(
        authenticate,
        permit(Object.keys(USER_TYPE)),
        serviceController.getAllUserService
    );

serviceRoute
    .route("/services/:id")
    .get(
        authenticate,
        permit(Object.keys(USER_TYPE)),
        serviceController.getServiceById
    )
    .delete(
        authenticate,
        permit(USER_TYPE.SERVICE_PROVIDER),
        serviceController.deleteService
    );

serviceRoute
    .route("/services/:type")
    .get(
        authenticate,
        permit(Object.keys(USER_TYPE)),
        serviceController.getServiceByType
    );