const discountRoute = require("../core/routerConfig");
const discountController = require("../controller/discountController");
const { authenticate, isAdmin } = require("../core/userAuth");
const { ADMIN_ROLES, ACCESS } = require("../utils/constants");


  discountRoute.route("/discount/add")
    .post(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.add
    )

    discountRoute.route("/discount/getAll")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.getAll
    )

    discountRoute.route("/discount/getOne/:id")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.getOne
    )

    discountRoute.route("/discount/deleteOne/:id")
    .delete(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.deleteOne
    )

    discountRoute.route("/discount/userDiscount")
    .post(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.userDiscount
    )

    discountRoute.route("/discount/userDiscount")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.getUser
    )

    discountRoute.route("/discount/referalDiscount/:id")
    .get(
        authenticate,
        isAdmin([ADMIN_ROLES.SUPER_ADMIN, ADMIN_ROLES.ADMIN], [ACCESS.ALL_ACCESS, ACCESS.LIMITED]),
        discountController.referalDiscount
    )

 
module.exports = discountRoute;

