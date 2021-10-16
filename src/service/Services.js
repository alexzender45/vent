const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters, performUpdate } = require("../utils/util");

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
      .orFail(() => throwError("Service Not Found", 404));
  }

  async getServiceByType() {
    const type = this.data;
    return await serviceSchema
      .find({ type })
      .orFail(() => throwError(`No Service Found For ${type} Type`, 404));
  }

  async getServiceByCategory() {
    const categoryId = this.data;
    return await serviceSchema
      .find({ categoryId })
      .orFail(() => throwError(`No Service Found For category`, 404));
  }

  async getAllUserServices() {
    const {userId, type} = this.data;
    const query = type ? {userId, type} : {userId};
    return await serviceSchema
      .find(query)
      .orFail(() => throwError("No Service Offered By User", 404));
  }

  async deleteService() {
    const service = await serviceSchema.deleteOne(this.data);
    if (service.deletedCount) {
      return "Service Deleted Successfully";
    }
    return "Service Not Listed By Provider";
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
      "location"
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
    const {categoryId, type, bestRated, recentlyAdded} = this.data;
    const page = Number(this.data.page);
    const limit = Number(this.data.limit);
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const data = {};
    const query = {};
    const sort = {};

    if(type) {
      query.type = type;
    }

    if(categoryId) {
      query.categoryId = categoryId;
    }

    const all_existing_services_count = await serviceSchema.countDocuments(query).exec();
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
      if(val && val === 'true') booleanValue = true;
      return booleanValue
    }

    const isBestRated = parseBoolean(bestRated);
    const isRecentlyAdded = parseBoolean(recentlyAdded);

    if(isBestRated) {
      sort.rating = 'asc';
      if(isRecentlyAdded) {
        sort.createdAt = -1
      }
    } else if(isRecentlyAdded) {
      sort.createdAt = 'asc';
      if(isBestRated) {
        sort.rating = -1
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

module.exports = Services;