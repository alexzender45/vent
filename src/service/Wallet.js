const WalletSchema = require("../models/wallet");
const { throwError } = require("../utils/handleErrors");
const Bank = require("./Bank");
const flutterwaveClient = require("../integration/flutterwaveClient");
const Transaction = require("./Transaction");
const { TRANSACTION_TYPE } = require("../utils/constants");

class Wallet {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createWallet() {
    return await new WalletSchema(this.data).save();
  }

  async getUserWallet() {
    return await WalletSchema
        .findOne({ userId: this.data })
        .orFail(() => throwError("User Wallet Not Found", 404));
  }

  async withdraw() {
    const { userId, bankId, amount, withdrawalReason, fullName } = this.data;
      this.data = userId;
      const userWallet = await this.getUserWallet();
      if(userWallet.currentBalance < amount) {
        throwError("Insufficient Available Balance")
      }

      const {bankCode, accountNumber} = await new Bank(bankId).getBank();

      const paymentData = {
          bankCode,
          accountNumber,
          amount,
          withdrawalReason,
          fullName
      };
      const {reference, paymentDate, status} = await flutterwaveClient.transferFunds(paymentData);

      const debitTransactionDetails = {
          userId: userId,
          amount: amount,
          reason: withdrawalReason,
          type: TRANSACTION_TYPE.WITHDRAWAL,
          reference: "WD" + reference,
          paymentDate: paymentDate,
          status: status
      };
      Transaction.createTransaction(debitTransactionDetails);

      userWallet.amountWithdrawn += Number(amount);
      return await userWallet.save();
  }

  async verifyWithdrawalPayment() {
      return await flutterwaveClient.verifyPayment(this.data.split("_")[2]);
  }
}

module.exports = Wallet;
