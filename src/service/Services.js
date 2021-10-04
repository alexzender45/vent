const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters, performUpdate } = require("../utils/util");
const cloud = require("../utils/cloudinaryConfig");

function addServiceLocation(parameters, userLocation) {
  const { useProfileLocation, country, state, address } = parameters;
  if (useProfileLocation && useProfileLocation.toLowerCase() == true) {
    parameters["location"] = userLocation;
  } else {
    parameters["location"] = {
      useProfileLocation,
      country,
      state,
      address,
    };
  }
}

class Services {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const { parameters, location } = this.data;
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
        "country",
        "state",
        "address",
      ],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    addServiceLocation(parameters, location);
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

  async getAllUserServices() {
    return await serviceSchema
      .find({ userId: this.data })
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
    const { id, newDetails, userLocation } = this.data;
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
    ];
    addServiceLocation(newDetails, userLocation);
    return await performUpdate(newDetails, allowedUpdates, serviceDetails);
  }

  static rateService(serviceId, rating) {
    return serviceSchema.findOneAndUpdate(
      { _id: serviceId },
      { rating: rating },
      { new: true }
    );
  }
}

module.exports = Services;