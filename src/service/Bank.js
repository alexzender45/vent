const { resolveAccountDetails } = require("../integration/flutterwaveClient");
const bankSchema = require('../models/bankModel');
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require('../utils/util');
const flutterwaveClient = require('../integration/flutterwaveClient');
const redisClient = require('../service/Redis');

class Bank {
    constructor(data) {
        this.data = data;
        this.errors = [];
    }

    async _bankExist() {
        const {userId, accountNumber} = this.data;
        const existingBank = await bankSchema.findOne({userId, accountNumber });
        if (existingBank) {
            this.errors.push('Bank Already Exists');
        }
    }

    async _getDefaultBank(userId) {
        return await bankSchema
            .findOne({userId: userId, isDefaultBank: true})
            .orFail(() => throwError('Bank Not Found', 404));
    }

    async getAllBanks() {
        return await bankSchema
            .find({userId: this.data})
            .orFail(() => throwError('User Bank Not Found', 404));
    }

    async addBank() {
        const { isValid, messages } = validateParameters(
            [
                "userId",
                "bankCode",
                "accountNumber",
                "accountName",
                "bankName"
            ],
            this.data
        );
        if (!isValid) {
            throwError(messages);
        }

        await this._bankExist();
        if (this.errors.length) {
            throwError(this.errors)
        }

        const existingUserBanks = await bankSchema.find({userId: this.data.userId});
        if(!existingUserBanks.length) {
            this.data['isDefaultBank'] = true;
        }

        return await new bankSchema(this.data).save();
    }

    async getBank() {
        return await bankSchema
            .findById(this.data)
            .orFail(() => throwError('Bank Not Found', 404));
    }

    async makeDefaultBank() {
        const {bankId, userId} = this.data;
        const defaultBank = await this._getDefaultBank(userId);
        defaultBank.isDefaultBank = false;

        this.data = bankId;
        const bank = await this.getBank();
        bank.isDefaultBank = true;
        await Promise.all([defaultBank.save(), bank.save()]);
        return 'default bank updated'
    }

    async deleteBank() {
        const {userId, bankId} = this.data;
        await bankSchema.deleteOne({_id: bankId});
        this.data = userId;
        const banks = await this.getAllBanks();
        if(banks && banks.length === 1) {
            let bank = banks[0];
            bank.isDefaultBank = true;
            bank.save();
        }
        return 'Bank Deleted Successfully'
    }

    static async getBankList() {
        const cachedBankList = await redisClient.getCachedData('banks');
        if(!cachedBankList) {
            const banksFromPayStack = await flutterwaveClient.getBanks();
            if(banksFromPayStack) {
                redisClient.cacheData('banks', JSON.stringify(banksFromPayStack), 2630000);
                return banksFromPayStack;
            }
            throwError("Error Getting Banks. Kindly contact customer support", 500)
        }
        return JSON.parse(cachedBankList);
    }

    async resolveAccountDetails() {
        const { isValid, messages } = validateParameters(
            [
                "accountNumber",
                "bankCode",
            ],
            this.data
        );
        if (!isValid) {
            throwError(messages);
        }
        const {accountNumber, bankCode} = this.data;
        return await resolveAccountDetails({account_number: accountNumber, account_bank: bankCode});
    }
}

module.exports = Bank;