const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const cloud = require("../utils/cloudinaryConfig");

class Services {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const {isValid, messages} = validateParameters(["type", "name", "categoryId", "description", "currency", "availabilityPeriod", "priceDescription", "location", "portfolioFiles"], this.data);
    if (!isValid) {
        throwError(messages);
    }
    let newFilePromise = [];
    const {portfolioFiles} = this.data;
    for (const file of portfolioFiles) {
      const newFile = cloud.uploads(file.path);
      newFilePromise.push(newFile);
    }
    let files = await Promise.all(newFilePromise);

    this.data["portfolioFiles"] = files.map(fileDetails => fileDetails.url);

    return new serviceSchema(this.data).save();
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
      const {id, userId} = this.data;
      this.data = userId;
    if(!this.getAllUserServices()) {
        await serviceSchema.findByIdAndRemove(id);
        return "Service Deleted Successfully";
    }
    return "Service Not Listed By Provider"
  }

  async updateService() {
    throwError("NOT SUPPORTED");
  }
}

module.exports = Services;
