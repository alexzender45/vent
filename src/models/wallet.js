const { Schema, model } = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const walletSchema = new Schema({
    userId: {
        type: String,
        index: true,
        required: true,
    },
    availableBalance: {
        type: Number,
        default: 0
    },
    currentBalance: {
        type: Number,
        default: 0
    },
    pendingWithdrawal: {
        type: Number,
        default: 0
    },
    amountWithdrawn: {
        type: Number,
        default: 0
    },
    earnedCommission: {
        type: Number,
        default: 0
    },
});

walletSchema.plugin(uniqueValidator, { message: '{TYPE} must be unique.' });

const wallet = model('wallet', walletSchema);
module.exports = wallet;