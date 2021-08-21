const axios = require('axios');
const {FACEBOOK_SIGN_IN_URL, FACEBOOK_ACCESS_TOKEN_URL, FACEBOOK_REDIRECT_URI, FACEBOOK_CLIENT_SECRET, FACEBOOK_CLIENT_ID, FACEBOOK_USER_DATA_URL, CONNECTION_TIMEOUT} = require('../core/config');
const axiosInstance = axios.create({timeout: Number(CONNECTION_TIMEOUT)});

exports.getFacebookSignInUrl = (uniqueRedirectUri) => {
    const queryParams = {
        client_id: FACEBOOK_CLIENT_ID,
        redirect_uri: FACEBOOK_REDIRECT_URI+uniqueRedirectUri+'/facebook-authenticate',
        scope: 'email,user_gender',
        response_type: 'code',
        auth_type: 'rerequest',
        display: 'popup',
    };

    let stringifiedQueryParams = '?';

    Object.keys(queryParams).forEach(e => stringifiedQueryParams += `${e}=${queryParams[e]}&`);

    stringifiedQueryParams = stringifiedQueryParams.substring(0, stringifiedQueryParams.length-1);

    return FACEBOOK_SIGN_IN_URL+stringifiedQueryParams
}

exports.getFacebookAccessToken = async (code, uniqueRedirectUri) => {
    const params = {
        client_id: FACEBOOK_CLIENT_ID,
        client_secret: FACEBOOK_CLIENT_SECRET,
        redirect_uri: FACEBOOK_REDIRECT_URI+uniqueRedirectUri+'/facebook-authenticate',
        code: code,
    };
    const {data} = await axiosInstance.get(FACEBOOK_ACCESS_TOKEN_URL, {params});
    return data.access_token;
}

exports.getFacebookUserData = async (accessToken) => {
    const params = {
        fields: 'email, first_name, last_name, gender',
        access_token: accessToken,
    };
    const { data } = await axiosInstance.get(FACEBOOK_USER_DATA_URL, {params});
    return data;
}
