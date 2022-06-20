const discountRoute = require("../core/routerConfig");
const discountController = require("../controller/discountController");
const accessController = require("../controller/accessController");
const { authenticate, isAdmin } = require("../core/userAuth");
const { ADMIN_ROLES, ACCESS } = require("../utils/constants");


  discountRoute.route("/access/add")
    .post(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.add
    )

    discountRoute.route("/access/getAll")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.getAll
    )

    discountRoute.route("/access/getOwner")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.getOwner
    )

    discountRoute.route("/access/getSupport")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.getSupport
    )

    discountRoute.route("/access/editOwner")
    .patch(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.editOwner
    )

    discountRoute.route("/access/editSupport")
    .patch(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.editSupport
    )

    discountRoute.route("/access/delete/:id")
    .delete(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        accessController.deleteOne
    )

 
module.exports = discountRoute;

