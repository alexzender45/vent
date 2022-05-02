const WalletSchema = require("../models/wallet");
const { TRANSACTION_TYPE, NOTIFICATION_TYPE } = require("../utils/constants");
const { showNotification, sendMessageorder } = require("../utils/notification");
const { throwError } = require("../utils/handleErrors");
const Bank = require("./Bank");
const flutterwaveClient = require("../integration/flutterwaveClient");
const Transaction = require("./Transaction");
const ServiceClient = require("./ServiceClient");
const ServiceProvider = require("./ServiceProvider");
const serviceProviderSchema = require("../models/serviceProviderModel");
const serviceClientSchema = require("../models/serviceClientModel");

class Wallet {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createWallet() {
    return await new WalletSchema(this.data).save();
  }

  async getUserWallet() {
    return await WalletSchema.findOne({ userId: this.data })
    .populate("userId")
    .orFail(() =>
      throwError("User Wallet Not Found", 404)
    );
  }

  async withdraw() {
    const { userId, bankId, amount, withdrawalReason, fullName } = this.data;
    this.data = userId;
    const userWallet = await this.getUserWallet();
    if (userWallet.currentBalance < amount) {
      throwError("Insufficient Available Balance");
    }

    const { bankCode, accountNumber } = await new Bank(bankId).getBank();

    const paymentData = {
      bankCode,
      accountNumber,
      amount,
      withdrawalReason,
      fullName,
    };
    const { reference, paymentDate, status } =
      await flutterwaveClient.transferFunds(paymentData);

    const debitTransactionDetails = {
      userId: userId,
      amount: amount,
      reason: `₦${amount} ${withdrawalReason}`,
      type: TRANSACTION_TYPE.WITHDRAWAL,
      reference: "WD" + reference,
      paymentDate: paymentDate,
      status: status,
    };
    Transaction.createTransaction(debitTransactionDetails);

    userWallet.amountWithdrawn += Number(amount);
    userWallet.currentBalance -= Number(amount);
    userWallet.availableBalance -= Number(amount);

    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      userWalletId: userWallet._id.toString(),
      type: NOTIFICATION_TYPE.WITHDRAWAL,
    }
    const message = await sendMessageorder(
      `Withdrawal Request Successful`,
      `You have successfully withdrawn ₦${amount} from your wallet.`, 
      data);
      if (userWallet.userId.firebaseToken) {
      await showNotification(userWallet.userId.firebaseToken, message);
      }
    return await userWallet.save();
  }

  async verifyWithdrawalPayment() {
    return await flutterwaveClient.verifyPayment(this.data.split("_")[2]);
  }
  async withdrawReferralEarnClient() {
    const { userId, bankId, amount, withdrawalReason, fullName } = this.data;
    const serviceClient = await serviceClientSchema.findById(userId);
    if (serviceClient.currentReferralBalance < Number(amount)) {
      throwError("Insufficient Available Balance");
    }
    const { bankCode, accountNumber } = await new Bank(bankId).getBank();
    const paymentData = {
      bankCode,
      accountNumber,
      amount,
      withdrawalReason,
      fullName,
    };
    const { reference, paymentDate, status } =
      await flutterwaveClient.transferFunds(paymentData);
    const debitTransactionDetails = {
      userId: userId,
      amount: amount,
      reason: `₦${amount} ${withdrawalReason}`,
      type: TRANSACTION_TYPE.WITHDRAWAL,
      reference: "WD" + reference,
      paymentDate: paymentDate,
      status: status,
    };
    Transaction.createTransaction(debitTransactionDetails);
    const currentReferralBalance =
      serviceClient.currentReferralBalance - Number(amount);
    await serviceClientSchema.findByIdAndUpdate(
      { _id: userId },
      {
        currentReferralBalance: currentReferralBalance,
      },
      {
        new: true,
      }
    );
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      userId: serviceClient._id.toString(),
      type: NOTIFICATION_TYPE.REFERRAL_WITHDRAWAL,
    }
    const message = await sendMessageorder(
      `Referral Withdrawal Request Successful`,
      `You have successfully withdrawn ₦${amount} from your referral wallet.`, 
      data);
      if (serviceClient.firebaseToken) {
      await showNotification(serviceClient.firebaseToken, message);
      }
    return serviceClient;
  }

  async withdrawReferralEarnProvider() {
    const { userId, bankId, amount, withdrawalReason, fullName } = this.data;
    const serviceClient = await serviceProviderSchema.findById(userId);
    if (serviceClient.currentReferralBalance < Number(amount)) {
      throwError("Insufficient Available Balance");
    }
    const { bankCode, accountNumber } = await new Bank(bankId).getBank();
    const paymentData = {
      bankCode,
      accountNumber,
      amount,
      withdrawalReason,
      fullName,
    };
    const { reference, paymentDate, status } =
      await flutterwaveClient.transferFunds(paymentData);
    const debitTransactionDetails = {
      userId: userId,
      amount: amount,
      reason: `₦${amount} ${withdrawalReason}`,
      type: TRANSACTION_TYPE.WITHDRAWAL,
      reference: "WD" + reference,
      paymentDate: paymentDate,
      status: status,
    };
    Transaction.createTransaction(debitTransactionDetails);
    const currentReferralBalance =
      serviceClient.currentReferralBalance - Number(amount);
    await serviceProviderSchema.findByIdAndUpdate(
      { _id: userId },
      {
        currentReferralBalance: currentReferralBalance,
      },
      {
        new: true,
      }
    );
    const data = {
      click_action: "FLUTTER_NOTIFICATION_CLICK",
      userId: serviceClient._id.toString(),
      type: NOTIFICATION_TYPE.REFERRAL_WITHDRAWAL,
    }
    const message = await sendMessageorder(
      `Referral Withdrawal Request Successful`,
      `You have successfully withdrawn ₦${amount} from your referral wallet.`, 
      data);
      if (serviceClient.firebaseToken) {
      await showNotification(serviceClient.firebaseToken, message);
      }
    return serviceClient;
  }
}

module.exports = Wallet;
