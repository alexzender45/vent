const ratingSchema = require("../models/ratingReviewModel");
const { throwError } = require("../utils/handleErrors");
const Order = require("./Order");
//const { validateParameters } = require("../utils/util");

class Rating {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async create() {
    const { reviewerId, orderId, rating, review } = this.data;
    const order = await Order.findById({ _id: orderId });
    const rating = new ratingSchema({
      providerId: order.providerId,
      serviceId: order.serviceId,
      reviewerId,
      rating,
      review,
    });
    let validationError = rating.validateSync();
    if (validationError) {
      Object.values(validationError.errors).forEach((e) => {
        if (e.reason) this.errors.push(e.reason.message);
        else this.errors.push(e.message.replace("Path ", ""));
      });
      throwError(this.errors);
    }

    return await rating.save();
  }

  async getAllProviderRating() {
    return await ratingSchema
      .find({ providerId: this.data })
      .orFail(() => throwError(`No Rating Found`, 404));
  }

  async getAllServiceRating() {
    return await ratingSchema
      .find({ serviceId: this.data })
      .orFail(() => throwError(`No Rating Found`, 404));
  }
}

module.exports = Rating;
