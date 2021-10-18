const WalletSchema = require("../models/wallet");
const { throwError } = require("../utils/handleErrors");

class Wallet {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createWallet() {
    return await new WalletSchema(this.data).save();
  }

  async getUserWallet() {
    return await WalletSchema.findOne({ userId: this.data }).orFail(() =>
      throwError("User Wallet Not Found", 404)
    );
  }
}

module.exports = Wallet;
