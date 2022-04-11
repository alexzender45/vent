const { error, success } = require("../utils/baseController");
const { logger } = require("../utils/logger");
const Chat = require("../service/Chat");

exports.create = async (req, res) => {
  try {
      req.body["senderId"] = req.user._id;
    const chat = await new Chat(req.body).create();
    return success(res, { chat });
  } catch (err) {
    logger.error("Error creating chat", err);
    return error(res, { code: err.code, message: err });
  }
};

exports.getUserChats = async (req, res) => {
    try {
        const senderId = req.user._id;
        const { offset } = req.query || 0;
        const { limit } = req.query || 10;
        const chats = await new Chat({senderId, offset, limit}).getUserChats();
        return success(res, { chats });
    } catch (err) {
        logger.error("Error getting user chats", err);
        return error(res, { code: err.code, message: err });
    }
    }

// get user chats with single user
exports.getUserChatsWithUser = async (req, res) => {
    try {
        const senderId = req.user._id;
        const receiverId = req.params.receiverId;
        const {offset} = req.query || 0;
        const {limit} = req.query || 10;
        const chats = await new Chat({senderId, receiverId, offset, limit}).getUserChatsWithSingleUser();
        return success(res, { chats });
    } catch (err) {
        logger.error("Error getting user chats", err);
        return error(res, { code: err.code, message: err });
    }
    }
exports.deleteChatById = async (req, res) => {
    try {
        const chatId = req.params.id;
        const senderId = req.user._id;
        const chat = await new Chat({
            chatId,
            senderId
        }).deleteChatById();
        return success(res, { chat });
    } catch (err) {
        logger.error("Error deleting chat", err);
        return error(res, { code: err.code, message: err });
    }
    }