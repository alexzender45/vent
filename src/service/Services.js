const serviceSchema = require("../models/servicesModel");
const serviceClientSchema = require("../models/serviceClientModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters, performUpdate } = require("../utils/util");
const ServiceClient = require("../service/ServiceClient");
function addServiceLocation(parameters) {
  const { useProfileLocation, country, state, address } = parameters;
  parameters["location"] = {
    useProfileLocation,
    country,
    state,
    address,
  };
}

class Services {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const parameters = this.data;
    const { isValid, messages } = validateParameters(
      [
        "type",
        "name",
        "categoryId",
        "description",
        "currency",
        "availabilityPeriod",
        "priceDescription",
        "portfolioFiles",
        "useProfileLocation",
        "country",
        "state",
        "address",
      ],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    addServiceLocation(parameters);
    return await new serviceSchema(parameters).save();
  }

  async getService() {
    return await serviceSchema
      .findById(this.data)
      .populate("userId", "fullName")
      .orFail(() => throwError("Service Not Found", 404));
  }

  async getServiceByType() {
    const { type, categoryId } = this.data;
    const query = {};
    if (categoryId) {
      query.categoryId = categoryId;
    }
    query.type = type;
    return await serviceSchema
      .find(query)
      .populate("userId", "fullName")
      .orFail(() => throwError(`No Service Found For ${type} Type`, 404));
  }

  async getServiceByCategory() {
    const categoryId = this.data;
    return await serviceSchema
      .find({ categoryId })
      .populate("userId", "fullName")
      .orFail(() => throwError(`No Service Found For category`, 404));
  }

  async getAllUserServices() {
    const { userId, type } = this.data;
    const query = type ? { userId, type } : { userId };
    return await serviceSchema
      .find(query)
      .populate("userId", "fullName")
  }

  async deleteService() {
    const service = await serviceSchema.deleteOne(this.data)
    const serviceClients = await serviceClientSchema.find();
    serviceClients.forEach(async(client) => {
      if(client.savedServices.includes(this.data.id)){
        client.savedServices.splice(client.savedServices.indexOf(this.data.id), 1);
        await client.save();
      }
    });
    if (service.deletedCount) {
      return "Service Deleted Successfully";
    }
    return "User Not authorized to delete this service";
  }

  async updateService() {
    const { id, newDetails } = this.data;
    this.data = id;
    const serviceDetails = await this.getService();
    const allowedUpdates = [
      "type",
      "name",
      "categoryId",
      "description",
      "useProfileLocation",
      "country",
      "state",
      "address",
      "features",
      "deliveryPeriod",
      "availabilityPeriod",
      "portfolioLink",
      "portfolioFiles",
      "currency",
      "priceDescription",
      "others",
      "location",
    ];
    addServiceLocation(newDetails);
    return await performUpdate(newDetails, allowedUpdates, serviceDetails);
  }

  static async rateService(serviceId, rating) {
    return await serviceSchema.findOneAndUpdate(
      { _id: serviceId },
      { rating: rating },
      { new: true }
    );
  }

  async getAllService() {
    const { categoryId, type, bestRated, recentlyAdded, serviceSearch } = this.data;
    const page = Number(this.data.page);
    const limit = Number(this.data.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const data = {};
    const query = {};
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

  async getServiceByUser() {
    const { userId } = this.data;
    return await serviceSchema.find({ userId });
  }
}

module.exports = Services;
