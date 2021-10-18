const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Wallet = require("../service/Wallet");

exports.getUserWallet = async (req, res) => {
  try {
    const {_doc} = await new Wallet(req.user._id).getUserWallet();
    const {currentBalance, pendingWithdrawal, amountWithdrawn} = _doc;
    _doc.totalAmountReceived = currentBalance + pendingWithdrawal + amountWithdrawn;
    return success(res, { wallet: _doc });
  } catch (err) {
    logger.error("Unable to get user wallet", err);
    return error(res, { code: err.code, message: err.message });
  }
};