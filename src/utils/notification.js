const admin = require("firebase-admin");
const serviceAccount = require('../config/google-services.json');
const firebasePrivateKey = require('../config/ventmode.json');
admin.initializeApp({
  credential: admin.credential.cert({
    serviceAccount,
    project_id: firebasePrivateKey.project_id,
    private_key_id: firebasePrivateKey.private_key_id,
    private_key: firebasePrivateKey.private_key,
    client_email: firebasePrivateKey.client_email,
    client_id: firebasePrivateKey.client_id,
  }),
});

const options = {
  timeToLive: 60 * 60 * 24,
};

async function showNotification(registrationToken, message) {
  admin
    .messaging()
    .sendToDevice(registrationToken, message, options)
    .then((response) => {
      console.log("Successfully sent message:", response);
      return { message: "Notification sent successfully" };
    })
    .catch((error) => {
      console.log("Error sending message:", error);
      return { message: "Notification sent failed" };
    });
}

async function sendMessage(title, body, icon, data) {
  let notification;
  console.log(icon === undefined);
  if(icon) {
      notification = {
        title,
        body,
        image: icon,
      }
    } else {
      notification = {
        title,
        body,
      }
    }
  }
    async function sendMessageorder(title, body, data) {
          notification = {
            title,
            body,
          };
  const message = {
    notification,
    data,
  }
  return message;
}

module.exports = {
  showNotification,
  sendMessage,
  sendMessageorder,
};
