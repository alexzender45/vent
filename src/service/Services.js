const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");

class Services {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const {isValid, messages} = validateParameters(["type", "name", "categoryId", "description"], this.data);
    if (!isValid) {
        throwError(messages);
    }
    return new serviceSchema(this.data).save();
  }

  async getService() {
    return await serviceSchema
      .findById(this.data)
      .orFail(() => throwError("Service Not Found", 404));
  }

  async getServiceByType() {
    return await serviceSchema
      .find({ type: this.data })
      .orFail(() => throwError(`No Service Found For ${type} Type`, 404));
  }

  async getAllUserServices() {
    return await serviceSchema
      .find({ userId: this.data })
      .orFail(() => throwError("No Service Offered By User", 404));
  }

  async deleteService() {
    return await serviceSchema.findByIdAndRemove(this.data);
  }

  async updateService() {
    throwError("NOT SUPPORTED");
  }
}

module.exports = Services;
