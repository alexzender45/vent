const ratingSchema = require("../models/ratingReviewModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");

class Rating {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async createRating() {
    let parameters = this.data;
    const { isValid, messages } = validateParameters(
      ["providerId", "reviewerId", "serviceId", "rating", "review"],
      parameters
    );
    if (!isValid) {
      throwError(messages);
    }
    return await new ratingSchema(parameters).save();
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
