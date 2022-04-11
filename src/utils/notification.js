const admin = require("firebase-admin");
const serviceAccount = require('../../google-services.json');
const firebasePrivateKey = require('../../firebase-private-key.json');
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
  priority: "high",
  timeToLive: 60 * 60 * 24,
};

async function showNotification(registrationToken, message) {
  admin
    .messaging()
    .sendToDevice(registrationToken, message, options)
    .then((response) => {
      //console.log("Successfully sent message:", response);
      return { message: "Notification sent successfully" };
    })
    .catch((error) => {
      //console.log("Error sending message:", error);
      return { message: "Notification sent failed" };
    });
}

module.exports = {
  showNotification,
};
