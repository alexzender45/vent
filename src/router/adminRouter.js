const adminRoute = require("../core/routerConfig");
const adminController = require("../controller/adminController");
const { authenticate, isAdmin } = require("../core/userAuth");
const { ADMIN_ROLES, ACCESS } = require("../utils/constants");

adminRoute
  .route("/admin")
  .post(adminController.signup)
  .get(
    authenticate,
    isAdmin([ADMIN_ROLES.SUPER_ADMIN], [ACCESS.ALL_ACCESS]),
    adminController.getAllAdmins
  )

  adminRoute.route("/admin/:id")
  .get(
    authenticate,
    isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
    adminController.getAdminById
  )

  adminRoute.route("/admin/approve/:id")
  .get(
    authenticate,
    isAdmin([ADMIN_ROLES.SUPER_ADMIN], [ACCESS.ALL_ACCESS]),
    adminController.approveAdmin
  )

    adminRoute.route("/admin/deactivate/:id")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN], [ACCESS.ALL_ACCESS]),
        adminController.deactivateAdmin
    )

  adminRoute.route("/admin/login")
  .post(adminController.login);

  adminRoute.route("/admin/dashboard/overview")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.overview
    )

    adminRoute.route("/admin/dashboard/completed-orders")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.getCompletedOrders
    )

    adminRoute.route("/admin/dashboard/top-service-providers")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.getTopServiceProviders
    )

    adminRoute.route("/admin/recent-orders")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.getRecentOrders
    )

    adminRoute.route("/admin/top-services")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.getTopServices
    )

    adminRoute.route("/admin/transactions")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        adminController.getSuccessfulTransactions
    )

module.exports = adminRoute;

