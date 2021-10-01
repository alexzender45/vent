const transactionRoute = require("../core/routerConfig");
const transactionController = require("../controller/transactionController");
const { authenticate, permit } = require("../core/userAuth");
const { ADMIN_ROLES, USER_TYPE } = require("../utils/constants");

transactionRoute
  .route("/transactions")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE).concat(Object.keys(ADMIN_ROLES))),
    transactionController.getAllUserTransactions
  );

transactionRoute
  .route("/transactions/user/:id")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE)),
    transactionController.getUserTransaction
  );

transactionRoute
  .route("/transactions/reference/:reference")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE).concat(Object.keys(ADMIN_ROLES))),
    transactionController.getTransactionByReference
  );

transactionRoute
  .route("/transactions/:id")
  .get(
    authenticate,
    permit(Object.keys(USER_TYPE).concat(Object.keys(ADMIN_ROLES))),
    transactionController.getTransaction
  );

module.exports = transactionRoute;
