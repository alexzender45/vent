const disputeSchema = require("../models/disputeModel");
const { throwError } = require("../utils/handleErrors");
const {validateParameters} = require("../utils/util");
const Order = require("./Order");

class Dispute {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createDispute() {
    let parameters = this.data;
    const {isValid, messages} = validateParameters(["reason", "orderId","providerId"], parameters);
    if (!isValid) {
        throwError(messages);
    }
    const { error } = await new Order().orderDispute(this.data.orderId);
    if (error) {
        throwError(error);
    }
    return await new disputeSchema(parameters).save();
  }

  // get all disputes
    async getAllDisputes() {
        return await disputeSchema.find().populate("orderId clientId providerId serviceId");
    }

    // get dispute by id
    async getDisputeById() {
        return await disputeSchema.findById(this.data)
        .populate("orderId clientId providerId serviceId")
        .orFail(() =>
            throwError("Dispute Not Found", 404)
        );
    }
}

module.exports = Dispute;
