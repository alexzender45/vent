// import { google } from 'googleapis';

// const googleConfig = {
//   clientId: GOOGLE_CONFIG_CLIENT_ID, // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
//   clientSecret: GOOGLE_CONFIG_CLIENT_SECRET, // e.g. _ASDFA%DFASDFASDFASD#FAD-
//   redirect: GOOGLE_CONFIG_REDIRECT_URI // this must match your google api settings
// };

// /**
//  * Create the google auth object which gives us access to talk to google's apis.
//  */
// function createConnection() {
//   return new google.auth.OAuth2(
//     googleConfig.clientId,
//     googleConfig.clientSecret,
//     googleConfig.redirect
//   );
// }

// const defaultScope = [
//     'https://www.googleapis.com/auth/plus.me',
//     'https://www.googleapis.com/auth/userinfo.email',
//   ];
  
//   /**
//    * Get a url which will open the google sign-in page and request access to the scope provided (such as calendar events).
//    */
//   function getConnectionUrl(auth) {
//     return auth.generateAuthUrl({
//       access_type: 'offline',
//       prompt: 'consent', // access type and approval prompt will force a new refresh token to be made each time signs in
//       scope: defaultScope
//     });
//   }
  
//   /**
//    * Create the google url to be sent to the client.
//    */
//   function urlGoogle() {
//     const auth = createConnection(); // this is from previous step
//     const url = getConnectionUrl(auth);
//     return url;
//   }

//   function getGoogleAccountFromCode(code) {
//     const data = await auth.getToken(code);
//     const tokens = data.tokens;
//     const auth = createConnection();
//     auth.setCredentials(tokens);
//     const plus = getGooglePlusApi(auth);
//     const me = await plus.people.get({ userId: 'me' });
//     const userGoogleId = me.data.id;
//     const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
//     return {
//       id: userGoogleId,
//       email: userGoogleEmail,
//       tokens: tokens,
//     };
//   }

const axios = require('axios');
const { google } = require('googleapis');
const { logger } = require('../../utils/logger');
const User = require('../models/user');
const { jwtManager } = require('../../utils/tokenizer');
//const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URL } = require('../config/config');

GOOGLE_CLIENT_ID='882942001497-mgn6rn2lrhjjrvevade0mknpq3t72vj2.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='AODrAoHQaMfHjG2-gpitTYG7'
GOOGLE_REDIRECT_URL='http://localhost:3000'

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URL,
);

module.exports = {
  Auth() {
    return {
      //Get googleUrl
      async googleUrl() {
        try {
          const scopes = [
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
          ].join(' ');

          const googleLoginUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: scopes,
          });
          return { googleLoginUrl };
        } catch (ex) {
          logger.log({
            level: 'error',
            message: ex.message,
          });
          return { error: ex };
        }
      },

      //convert the code to an access token
      async googleAccessToken(code) {
        try {
          const tokens = await oauth2Client.getToken(code);

          // eslint-disable-next-line camelcase
          const { access_token } = tokens.tokens;

          // eslint-disable-next-line camelcase
          if (access_token) {
            const {
              // eslint-disable-next-line camelcase
              email, given_name, family_name,
            } = await this.getGoogleUserInfo(access_token);
            if (email) {
              const userExist = await User.findOne({ email });
              if (!userExist) {
                const password = await hashManager().hash(given_name);
                const newUser = await User.create({
                  email,
                  password,
                  firstname: given_name,
                  lastname: family_name,
                  isVerified: true,
                });

                // eslint-disable-next-line no-use-before-define
                return await getResponse(newUser);
              }
              // eslint-disable-next-line no-use-before-define
              return await getResponse(userExist);
            }
          }
          return { error: 'Error signing in' };
        } catch (ex) {
          logger.log({
            level: 'error',
            message: ex.message,
          });
          return { error: ex };
        }
      },

      //Use the access token to get user details

      // eslint-disable-next-line camelcase
      async getGoogleUserInfo(access_token) {
        try {
          const { data } = await axios({
            url: 'https://www.googleapis.com/oauth2/v2/userinfo',
            method: 'get',
            headers: {
              // eslint-disable-next-line camelcase
              Authorization: `Bearer ${access_token}`,
            },
          });
          return data;
        } catch (ex) {
          logger.log({
            level: 'error',
            message: ex.message,
          });
          return { error: ex };
        }
      },
    };
  },
};

async function getResponse(user) {
  const response = user.toObject();
  delete response.password;
  delete response.token;
  // eslint-disable-next-line no-underscore-dangle
  delete response.__v;
  return {
    token: await jwtManager().sign({
      email: response.email,
      // eslint-disable-next-line no-underscore-dangle
      userId: response._id,
    }),
    // eslint-disable-next-line no-underscore-dangle
    userId: response._id,
    user: response,
  };
}z


