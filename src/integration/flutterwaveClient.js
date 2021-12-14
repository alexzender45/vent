const axios = require('axios');
const { throwError } = require("../utils/handleErrors");
const { logger } = require("../utils/logger");
const { FLUTTER_WAVE_SECRET_KEY, FLUTTER_WAVE_BASE_URL, FLUTTER_CALLBACK_URL, CONNECTION_TIMEOUT } = require('../core/config');

const getHeaders = () => {
    return {
        'Authorization': `Bearer ${FLUTTER_WAVE_SECRET_KEY}`,
        'Content-Type': 'application/json'
    };
}

const axiosInstance = axios.create({
    baseURL: FLUTTER_WAVE_BASE_URL,
    timeout: Number(CONNECTION_TIMEOUT),
    headers: getHeaders()
});

const processException = (e, message) => {
    if(e.response) {
        const {status, data} = e.response;
        if(data && status === 400){
            message = {message: data.message, code: status};
        }
    }
    return message;
}

exports.getBanks = async () => {
    try {
        const response = await axiosInstance.get('/banks/NG');
        return response.data.data;
    } catch (e) {
        logger.error('Error getting banks from flutterwave', e);
        throwError('Error getting banks. Kindly Contact The Administrator', 500);
    }
}

exports.resolveAccountDetails = async (data) => {
    try {
        const response = await axiosInstance.post(`accounts/resolve`, data  );
        const {account_name, account_number} = response.data.data;
        return {
            accountName: account_name,
            accountNumber: account_number
        }
    } catch (e) {
        let message = {message: 'Error resolving account details. Kindly Contact The Administrator', code: 500};
        processException(e, message);
        logger.error('Error resolving account details with flutterwave', e);
        throwError(message);
    }
}

exports.transferFunds = async (data) => {
    try {
        const {bankCode, accountNumber, amount, withdrawalReason, fullName} = data;
        const transferRequest = {
            beneficiary_name: fullName,
            account_bank: bankCode,
            account_number: accountNumber,
            amount: amount,
            narration: withdrawalReason,
            currency: 'NGN', //TODO how many currency are we supporting
            reference: new Date().getTime()+'_WD_',
            callback_url: FLUTTER_CALLBACK_URL,
            debit_currency: 'NGN' //TODO how many currency are we supporting
        };
        const response = await axiosInstance.post(`/transfers`, transferRequest);
        const {reference, created_at, id} = response.data.data;
        const {status} = response.data;
        return {reference: reference+id, paymentDate: created_at, status: status.toUpperCase() };
    } catch (e) {
        console.log(e);
        let message = {message: 'Error making withdrawal. Kindly Contact The Administrator', code: 500};
        message = processException(e, message);
        logger.error('Error making withdrawal with flutterwave', e);
        throwError(message);
    }
}

exports.verifyPayment = async (transferId) => {
    try {
        const response = await axiosInstance.get(`/transfers/${transferId}`);
        const {status, complete_message} = response.data.data;
        return { status: status, message: complete_message };
    } catch (e) {
        let message = {message: 'Error verifying withdrawal payment. Kindly Contact The Administrator', code: 500};
        message = processException(e, message);
        logger.error('Error verifying withdrawal payment with flutterwave', e);
        throwError(message)
    }
}