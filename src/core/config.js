require('dotenv').config();

module.exports = {
  MONGODB_URI: process.env.MONGODB_URI,
  MONGODB_TEST_URI: process.env.MONGODB_TEST_URI,
  JWT_SECRETE_KEY: process.env.JWT_SECRETE_KEY,
  PORT: process.env.PORT || 6000,
  TOKEN_DURATION: process.env.TOKEN_DURATION || '720h',
  AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_REGION: process.env.AWS_REGION,
  S3_BUCKET: process.env.S3_BUCKET,
  UPLOAD_TIMEOUT: process.env.UPLOAD_TIMEOUT,
  CONNECTION_TIMEOUT: process.env.CONNECTION_TIMEOUT,
  FILE_SIZE: process.env.FILE_SIZE,
  DEFAULT_IMAGE_URL: process.env.DEFAULT_IMAGE_URL,
  EMAIL_SENDER: process.env.EMAIL_SENDER,
  FRONT_END_BASE_URL: process.env.FRONT_END_BASE_URL,
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
  VERIFIED_EMAIL: process.env.VERIFIED_EMAIL,
  SENDGRID_TEMPLATEID: process.env.SENDGRID_TEMPLATEID,
  POST_SIZE_LIMIT: process.env.POST_SIZE_LIMIT,
  AMOUNT: process.env.AMOUNT,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  SEED_ENABLED: process.env.SEED_ENABLED,
  PAYSTACK_BASE_URL: process.env.PAYSTACK_BASE_URL,
  SUPPORTED_PHONE_FORMAT: process.env.SUPPORTED_PHONE_FORMAT.split(","),
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  REDIS_URL: process.env.REDIS_URL,
  OTP_DURATION: process.env.OTP_DURATION,
  GOOGLE_CONFIG_CLIENT_ID: process.env.GOOGLE_CONFIG_CLIENT_ID,
  GOOGLE_CONFIG_CLIENT_SECRET: process.env.GOOGLE_CONFIG_CLIENT_SECRET,
  GOOGLE_CONFIG_REDIRECT_URI: process.env.GOOGLE_CONFIG_REDIRECT_URI,
};