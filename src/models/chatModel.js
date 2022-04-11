const { Schema, model } = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const chatSchema = new Schema(
  {
    senderId: {
      type: Schema.Types.ObjectId,
    },
    receiverId: {
      type: Schema.Types.ObjectId,
    },
    roomId: {
      type: String,
      required: true,
    },
    message: {
        type: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strictQuery: "throw",
  }
);

chatSchema.plugin(uniqueValidator, { message: "{TYPE} must be unique." });

const ChatModel = model("Chat", chatSchema);
module.exports = ChatModel;
