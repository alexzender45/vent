const chatRoute = require("../core/routerConfig");
const chatController = require("../controller/chatController");
const { authenticate, permit } = require("../core/userAuth");
const { USER_TYPE } = require("../utils/constants");

chatRoute
  .route("/chats")
  .post(authenticate, chatController.create)
  .get(authenticate, chatController.getUserChats);
chatRoute
  .route("/chats/:receiverId")
  .get(authenticate, chatController.getUserChatsWithUser);

chatRoute
    .route("/chats/:id")
    .delete(authenticate, chatController.deleteChatById)

module.exports = chatRoute;
