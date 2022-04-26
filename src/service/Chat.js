const chatSchema = require("../models/chatModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const ServiceClient = require("../service/ServiceClient");
const ServiceProvider = require("../service/ServiceProvider");
const { showNotification, sendMessage } = require("../utils/notification");

class Chat {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const { isValid, messages } = validateParameters(
      ["message", "receiverId"],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    this.data["senderId"] = this.data.senderId;
    const chatExist = await chatSchema.findOne({
      senderId: this.data.senderId,
      receiverId: this.data.receiverId,
    });
    let serviceClient = await new ServiceClient(
      this.data.receiverId
    ).getClientByIdChat();
    let serviceProvider = await new ServiceProvider(
      this.data.receiverId
    ).getProviderByIdChat();
    const token = [];
    let name;
    let profileImage;
    if (serviceClient) {
      token.push(serviceClient.firebaseToken);
      name = serviceClient.fullName;
      profileImage = serviceClient.profilePictureUrl;
    } else if (serviceProvider) {
      token.push(serviceProvider.firebaseToken);
      name = serviceProvider.fullName;
      profileImage = serviceProvider.profilePictureUrl;
    }
    if (chatExist) {
      this.data.roomId = chatExist.roomId;
      const  chat = await new chatSchema(this.data).save();
      const data = {
        id: chat._id.toString(),
        senderId: chat.senderId.toString(),
      }
      const message = await sendMessage(name, chat.message, data);
      await showNotification(token, message);
      return chat;
    }
    this.data["roomId"] = this.data.senderId + this.data.receiverId;
    const  chat = await new chatSchema(this.data).save();
    const data = {
      id: chat._id.toString(),
      senderId: chat.senderId.toString(),
    }
    const message = await sendMessage(name, chat.message, profileImage, data);
    console.log(message);
    await showNotification(token, message);
    return chat;
  }

  // get user chats
  async getUserChats() {
    const userChat = [];
    const chats = await chatSchema
      .find({
        $or: [
          { senderId: this.data.senderId },
          { receiverId: this.data.senderId },
        ],
      })
      .skip(parseInt(this.data.offset))
      .limit(parseInt(this.data.limit));
    await Promise.all(
      chats.map(async (chat) => {
        let serviceClient = await new ServiceClient(
          chat.receiverId
        ).getClientByIdChat();
        if (serviceClient) {
          userChat.push({
            chat,
            fullName: serviceClient.fullName,
            profileImage: serviceClient.profilePictureUrl,
          });
            return userChat;
        }
        let serviceProvider = await new ServiceProvider(
          chat.receiverId
        ).getProviderByIdChat();
        if (serviceProvider) {
          userChat.push({
            chat,
            fullName: serviceProvider.fullName,
            profileImage: serviceProvider.profilePictureUrl,
          });
          // sort by date
          return userChat;
        }
      })
    );
    userChat.sort((a, b) => {
        return new Date(b.chat.createdAt) - new Date(a.chat.createdAt);
        });
    const uniqueChats = userChat.reduce((acc, curr) => {
        const x = acc.find((item) => item.chat.roomId === curr.chat.roomId);
        if (!x) {
            return acc.concat([curr]);
        }
        return acc;
        }, []);
    return uniqueChats;
  }
  // get user chats with single user
    async getUserChatsWithSingleUser() {
        const chatBetweenUsers = [];
        const userChat = [];
        let chats = await chatSchema
            .find({    
                roomId: `${this.data.senderId}${this.data.receiverId}`,
            })
            .skip(parseInt(this.data.offset))
            .limit(parseInt(this.data.limit));
            if(chats.length > 0){
                await Promise.all(
                    chats.map(async(chart) => {
                        chatBetweenUsers.push(chart)
                    }))
            }
            chats = await chatSchema
            .find({    
                roomId: `${this.data.receiverId}${this.data.senderId}`,
            })
            .skip(parseInt(this.data.offset))
            .limit(parseInt(this.data.limit));
            if(chats.length > 0){
                await Promise.all(
                    chats.map(async(chart) => {
                        chatBetweenUsers.push(chart)
                    }))
            }
        await Promise.all(
           chatBetweenUsers.map(async (chat) => {
                let serviceClient = await new ServiceClient(
                    chat.senderId
                ).getClientByIdChat();
                if (serviceClient) {
                    userChat.push({
                        chat,
                        fullName: serviceClient.fullName,
                        profileImage: serviceClient.profilePictureUrl,
                    });
                    return userChat;
                }
                let serviceProvider = await new ServiceProvider(
                    chat.senderId
                ).getProviderByIdChat();
                if (serviceProvider) {
                    userChat.push({
                        chat,
                        fullName: serviceProvider.fullName,
                        profileImage: serviceProvider.profilePictureUrl,
                    });
                    return userChat;
                }
            })
        );
        return userChat;
    }
    // delete chat by id if user is sender
    async deleteChatById() {
        const chat = await chatSchema.findById(this.data.chatId);
        if(chat.senderId.toString() === this.data.senderId.toString()){
            return await chatSchema.findByIdAndDelete(this.data.chatId);
        }
        return false;
    }
}

module.exports = Chat;
