const serviceSchema = require("../models/servicesModel");
const { throwError } = require("../utils/handleErrors");

class Services {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    let parameters = this.data;
    const service = new serviceSchema(parameters);
    let validationError = service.validateSync();
    if (validationError) {
      Object.values(validationError.errors).forEach((e) => {
        if (e.reason) this.errors.push(e.reason.message);
        else this.errors.push(e.message.replace("Path ", ""));
      });
      throwError(this.errors);
    }

    return await service.save();
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
