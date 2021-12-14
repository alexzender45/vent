const bankRoute = require("../core/routerConfig");
const bankController = require("../controller/bankController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

bankRoute.route("/banks").post(authenticate, bankController.addBank);

bankRoute
  .route("/banks/resolve-account")
  .post(authenticate, bankController.resolveAccountDetails);

bankRoute.route("/banks").get(authenticate, bankController.getAllBanks);

bankRoute.route("/banks/list").get(authenticate, bankController.getBankList);

bankRoute
  .route("/banks/:id")
  .get(authenticate, bankController.getBank)
  .put(authenticate, bankController.makeDefaultBank)
  .delete(authenticate, bankController.deleteBank);

module.exports = bankRoute;
