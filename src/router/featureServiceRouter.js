const featuredServiceRoute = require("../core/routerConfig");
const featuredServiceController = require("../controller/featuredServiceController");
const { authenticate, isAdmin } = require("../core/userAuth");
const { ADMIN_ROLES, ACCESS } = require("../utils/constants");

featuredServiceRoute
  .route("/featured-services")
  .post(
    authenticate,
    isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
    featuredServiceController.createFeaturedService
  )
  .get(authenticate, featuredServiceController.getAllFeaturedService);

featuredServiceRoute
  .route("/featured-services/:id")
  .get(authenticate, featuredServiceController.getFeaturedServiceById)
  .put(
      authenticate,
      isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
     featuredServiceController.updateFeaturedService)

featuredServiceRoute
    .route("/active/featured-services")
    .get(authenticate, featuredServiceController.getActiveFeaturedService)

featuredServiceRoute
    .route("/make-service-featured")
    .post(authenticate, featuredServiceController.makeServiceFeatured)

featuredServiceRoute
    .route("/update-feature-service/transaction/:id")
    .put(authenticate, featuredServiceController.updateFeaturedServiceTransaction)

featuredServiceRoute
    .route("/get-all-featured-services")
    .get(authenticate, featuredServiceController.getAllFeaturedServices)

module.exports = featuredServiceRoute;