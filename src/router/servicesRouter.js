const servicesRoute = require("../core/routerConfig");
const servicesController = require("../controller/servicesController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");
const upload = require("../core/multer");

servicesRoute
    .route("/services")
    .post(
        authenticate,
        permit([USER_TYPE.SERVICE_PROVIDER]),
        upload.imageUpload.any(),
        servicesController.create
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