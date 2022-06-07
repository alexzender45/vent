const featuredServiceSchema = require("../models/featuredServiceModel");
const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");
const {validateParameters} = require("../utils/util");
const {
    TRANSACTION_TYPE,
    NOTIFICATION_TYPE,
    PAYMENT_STATUS,
  } = require("../utils/constants");
  const Transaction = require("../service/Transaction");
  const Notification = require("./Notification");
  const { showNotification, sendMessageorder } = require("../utils/notification");

class FeaturedService {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createFeaturedService() {
    let parameters = this.data;
    const {isValid, messages} = validateParameters(["amount", "active", "activeFor"], parameters);
    if (!isValid) {
        throwError(messages);
    }
    return await new featuredServiceSchema(parameters).save();
  }

  // get all featured services
    async getAllFeaturedServices() {
        return await featuredServiceSchema.find();
    }

    // get featured service by id
    async getFeaturedServiceById() {
        return await featuredServiceSchema.findById(this.data)
        .orFail(() =>
            throwError("Featured Service Not Found", 404)
        );
    }

    // get active featured services
    async getActiveFeaturedServices() {
        return await featuredServiceSchema.find({active: true});
    }

    // update featured service
    async updateFeaturedService() {
        return await featuredServiceSchema.findByIdAndUpdate(this.data.id, this.data.newDetails, {new: true});
    }

    async makeServiceFeatured() {
        const { paymentStatus, transactionId, serviceId, featuredServiceId, amount } = this.data;
        const referenceCode = Math.floor(100000 + Math.random() * 100000);
        const service = await serviceSchema.findById(serviceId)
        .populate("userId", "fullName firebaseToken")
        if(service && service.transactionId === transactionId) {
        if (paymentStatus === PAYMENT_STATUS.SUCCESS) {
          const debitTransactionDetails = {
            userId: service.userId._id,
            amount: amount,
            reason: `Pay #${amount} for featured service`,
            type: TRANSACTION_TYPE.DEBIT,
            reference: "ORD" + referenceCode,
            paymentDate: Date.now(),
          };
          Transaction.createTransaction(debitTransactionDetails);
            const notificationDetails = {
              userId: service.userId._id,
              message:`${service.name} is now featured`,
              serviceId: serviceId,
              image: service.portfolioFiles[0],
              price: amount,
              serviceName: service.name,
              notificationType: NOTIFICATION_TYPE.FEATURED_SERVICE,
            };
            Notification.createNotification(notificationDetails);
            const data = {
              click_action: "FLUTTER_NOTIFICATION_CLICK",
              serviceId: service._id.toString(),
              type: NOTIFICATION_TYPE.FEATURED_SERVICE,
            };
            const message = await sendMessageorder(
              `Hi ${service.userId.fullName}`,
              `Your service ${service.name} is now featured`,
              data
            );
            if (service.userId.firebaseToken) {
              await showNotification(service.userId.firebaseToken, message);
            }
          service.isFeatured = true;
          service.featuredServiceId = featuredServiceId;
            await service.save();
        }
        } else {
          throwError("Payment Failed", 400);
      }
}
async updateFeaturedServiceTransaction() {
    const service = await serviceSchema.findByIdAndUpdate(this.data.id, this.data.transactionId, {new: true})
    .orFail(() =>
        throwError("Service Not Found", 404)
    );
    return service;
}

// get featured services
async getFeaturedServices() {
        const { categoryId, type, bestRated, recentlyAdded, serviceSearch } = this.data;
        const page = Number(this.data.page);
        const limit = Number(this.data.limit);
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const data = {};
        const query = {isFeatured: true};
        const sort = {};
    
        if (type) {
          query.type = type;
        }
    
        if (categoryId) {
          query.categoryId = categoryId;
        }
        
       if(serviceSearch){
        serviceSearch.replace(/\s+/g, " ").trim();
        query.$or = [
          {
            name: { $regex: serviceSearch, $options: "i" },
          },
        ];
      }
        const all_existing_services_count = await serviceSchema
          .countDocuments(query)
          .exec();
        if (endIndex < all_existing_services_count) {
          data.next = {
            page: page + 1,
            limit: limit,
          };
        }
        if (startIndex > 0) {
          data.previous = {
            page: page - 1,
            limit: limit,
          };
        }
    
        const parseBoolean = (val) => {
          let booleanValue = false;
          if (val && val === "true") booleanValue = true;
          return booleanValue;
        };
    
        const isBestRated = parseBoolean(bestRated);
        const isRecentlyAdded = parseBoolean(recentlyAdded);
    
        if (isBestRated) {
          sort.rating = "asc";
          if (isRecentlyAdded) {
            sort.createdAt = -1;
          }
        } else if (isRecentlyAdded) {
          sort.createdAt = "asc";
          if (isBestRated) {
            sort.rating = -1;
          }
        }
        data.services = await serviceSchema
          .find(query)
          .populate("userId", "fullName")
          .sort(sort)
          .limit(limit)
          .skip(startIndex);
        return data;
}
}

module.exports = FeaturedService;
