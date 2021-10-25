const {
  SENDGRID_API_KEY,
  VERIFIED_EMAIL,
  SENDGRID_TEMPLATEID,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER,
} = require("../core/config");
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(SENDGRID_API_KEY);
const client = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const { logger } = require("../utils/logger");
const { throwError } = require("../utils/handleErrors");
const { cacheData } = require("../service/Redis");

const verificationCode = Math.floor(100000 + Math.random() * 100000);

function sendEmailToken(Email, token) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Activation Token",
    html: `<h4>Hello,</h4>
      <p>Please use this <b> ${token} </b> to activate your account </p>
      <p><b>Regards,</b></p>
      <p><b>Ventmode</b></p>
      `,
  };
  sgMail
    .send(msg)
    .then((result) => {})
    .catch((error) => {
      console.error(error);
      if (error.response) {
        const { response } = error;
        const { body } = response;
        return body;
      }
    });
}

function sendResetPasswordToken(Email, firstName, token) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Password Reset Token",
    html: `<h4>Hello ${firstName},</h4>
              <p>Please use this <b> ${token} </b> to reset your password </p>
              <p><b>Regards,</b></p>
              <p><b>Ventmode</b></p>
              `,
  };
  sgMail
    .send(msg)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error(error);
      if (error.response) {
        const { response } = error;
        const { body } = response;
        console.error(body);
      }
    });
}

function sendSuccessfulRegistrationEmail(Email, firstName) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Registration Successful",
    html: `<h4>Hello ${firstName},</h4>
              <p>Thanks for joining Ventmode, Your Registration is successful</p>`,
  };
  sgMail
    .send(msg)
    .then((result) => result)
    .catch((error) => {
      if (error.response) {
        const { response } = error;
        const { body } = response;
        console.error(body);
      }
    });
}

function SuccessfulPasswordReset(Name, Email) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Your Password Reset Successful",
    html: `<h1>Dear ${Name},</h1>
        <p>Your request to reset your Kampe password is successful. Upon your next login
        please use your new password.</p>
        <p><b>Regards,</b></p>
        <p><b>Ventmode</b></p>`,
  };

  sgMail
    .send(msg)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      // Log friendly error
      console.error(error);

      if (error.response) {
        // Extract error msg
        const { message, code, response } = error;

        // Extract response msg
        const { headers, body } = response;

        console.error(body);
      }
    });
}

function orderNotification(
  Email,
  fullName,
  serviceName,
  orderReference,
  status,
  message
) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Order Notice",
    html: `<h4>Hello,${fullName}</h4>
      <p>Your Order <b>${serviceName}</b>, with reference number <b>${orderReference}</b> ${status}.</p>
      <p>${message}</p>
      <p><b>Regards,</b></p>
      <p><b>Ventmode</b></p>
      `,
  };
  sgMail
    .send(msg)
    .then((result) => {})
    .catch((error) => {
      console.error(error);
      if (error.response) {
        const { response } = error;
        const { body } = response;
        return body;
      }
    });
}

function orderPaidNotification(Email, fullName, totalAmount) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Payment for Orders",
    html: `<h4>Hello,${fullName}</h4>
      <p>You made a total payment of <b>${totalAmount}</b> for your orders</p>
      <p><b>Regards,</b></p>
      <p><b>Ventmode</b></p>
      `,
  };
  sgMail
    .send(msg)
    .then((result) => {})
    .catch((error) => {
      console.error(error);
      if (error.response) {
        const { response } = error;
        const { body } = response;
        return body;
      }
    });
}

function orderPaidNotificationForProvider(
  Email,
  fullName,
  totalAmount,
  numberOfItems,
  orderReference,
  clientName,
  clientPhoneNumber,
  clientEmail,
  serviceName
) {
  const msg = {
    to: Email, // Change to your recipient
    from: VERIFIED_EMAIL, // Change to your verified sender
    subject: "Payment for Orders",
    html: `<h4>Hello,${fullName}</h4>
      <p>Client <b>${clientName}</b> made a total payment of <b>${totalAmount}</b> for your service </p>
      <p>Number of items: <b>${numberOfItems}</b></p>
      <p>Order Reference: <b>${orderReference}</b></p>
      <p>Client Phone Number: <b>${clientPhoneNumber}</b></p>
      <p>Client Email: <b>${clientEmail}</b></p>
      <p>Service Name: <b>${serviceName}</b></p>
      <p><b>Regards,</b></p>
      <p><b>Ventmode</b></p>
      `,
  };
  sgMail
    .send(msg)
    .then((result) => {})
    .catch((error) => {
      console.error(error);
      if (error.response) {
        const { response } = error;
        const { body } = response;
        return body;
      }
    });
}

async function sendSms(message, recipient) {
  return await client.messages.create({
    body: message,
    from: TWILIO_PHONE_NUMBER,
    to: recipient,
  });
}

async function sendEmailVerificationToken(email) {
  try {
    const verificationCode1 = Math.floor(100000 + Math.random() * 100000);
    await sendEmailToken(email, verificationCode1);
    cacheData(email, verificationCode1);
    return {
      message: `OTP Message sent to ${email} successfully`,
      data: "success",
      status: 200,
    };
  } catch (error) {
    logger.error("Error occurred sending token", error);
    return {
      message: `Error occurred sending OTP Message to ${email}`,
      data: error.message,
      status: 500,
    };
  }
}

async function sendResetPasswordTokenToSms(phoneNumber, token) {
  const message = `Your Ventmode password reset code is: ${token}`;
  try {
    await sendSms(message, phoneNumber);
    return {
      message: `Password Reset Code sent to ${phoneNumber} successfully`,
      data: verificationCode,
      status: 200,
    };
  } catch (error) {
    logger.error("Error occurred sending password reset code", error);
    throwError(
      `Error occurred sending password reset code to ${phoneNumber}`,
      500
    );
  }
}

module.exports = {
  SuccessfulPasswordReset,
  sendSuccessfulRegistrationEmail,
  sendResetPasswordToken,
  sendResetPasswordTokenToSms,
  verificationCode,
  sendEmailVerificationToken,
  orderNotification,
  orderPaidNotification,
  orderPaidNotificationForProvider,
};
