const ratingSchema = require("../models/ratingReviewModel");
const { throwError } = require("../utils/handleErrors");
const orderSchema = require("../models/orderModel");
//const { validateParameters } = require("../utils/util");

class Rating {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createRating() {
    const { reviewerId, orderId, rating, review } = this.data;
    const order = await orderSchema.findById({ _id: orderId });
    const createRating = new ratingSchema({
      providerId: order.providerId,
      serviceId: order.serviceId,
      reviewerId,
      rating,
      review,
    });
    let validationError = createRating.validateSync();
    if (validationError) {
      Object.values(validationError.errors).forEach((e) => {
        if (e.reason) this.errors.push(e.reason.message);
        else this.errors.push(e.message.replace("Path ", ""));
      });
      throwError(this.errors);
    }

    return await createRating.save();
  }

  async getAllProviderRating() {
    return await ratingSchema
      .find({ providerId: this.data })
      .populate("reviewerId", "fullName profilePictureUrl userType")
      .orFail(() => throwError(`No Rating Found`, 404));
  }

  async getAllServiceRating() {
    return await ratingSchema
      .find({ serviceId: this.data })
      .orFail(() => throwError(`No Rating Found`, 404));
  }
}

module.exports = Rating;
