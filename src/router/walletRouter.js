const walletRoute = require("../core/routerConfig");
const walletController = require("../controller/walletController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE, ADMIN_ROLES } = require("../utils/constants");

walletRoute
  .route("/wallets")
  .get(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    walletController.getUserWallet
  );

walletRoute
  .route("/wallets/withdraw")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_PROVIDER]),
    walletController.withdrawFunds
  );

walletRoute
  .route("/wallets/withdraw/referral-earn/client")
  .post(authenticate, walletController.withdrawReferralEarnClient);

walletRoute
  .route("/wallets/withdraw/referral-earn/provider")
  .post(authenticate, walletController.withdrawReferralEarnProvider);

walletRoute
  .route("/wallets/verify-withdrawal/:reference")
  .get(
    authenticate,
    permit(Object.keys(ADMIN_ROLES).concat(USER_TYPE.SERVICE_PROVIDER)),
    walletController.verifyWithdrawalPayment
  );

module.exports = walletRoute;
