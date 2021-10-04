const ratingSchema = require("../models/ratingReviewModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const Services = require("./Services");

const computeFiveStarRating = async (serviceId) => {
  const serviceRatings = await ratingSchema.find({ serviceId });
  const ratings = new Map();

  serviceRatings.forEach((serviceRating) => {
    const rating = serviceRating.rating;
    const existingRating = ratings.get(rating);
    existingRating
      ? ratings.set(rating, existingRating + 1)
      : ratings.set(rating, 1);
  });

  let five_star_count = ratings.get(5) || 0;
  let four_star_count = ratings.get(4) || 0;
  let three_star_count = ratings.get(3) || 0;
  let two_star_count = ratings.get(2) || 0;
  let one_star_count = ratings.get(1) || 0;

  const scoreRating =
    5 * five_star_count +
    4 * four_star_count +
    3 * three_star_count +
    2 * two_star_count +
    one_star_count;
  const responseTotal =
    five_star_count +
    four_star_count +
    three_star_count +
    two_star_count +
    one_star_count;
  const five_star_rating = scoreRating / responseTotal;

  return five_star_rating.toFixed(1);
};

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
    const newRating = await new ratingSchema(parameters).save();
    const { serviceId } = newRating;
    const rating = await computeFiveStarRating(serviceId);
    await new Services({ serviceId, rating }).rateService();
    return newRating;
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
