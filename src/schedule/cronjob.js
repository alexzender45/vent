const cron = require("node-cron");
const { DAILY_CRON_SCHEDULE } = require("../core/config");
const ServiceClientSchema = require("../models/serviceClientModel");

const isStatusLongerThan24Hour = (createdDate) => {
  let now = +new Date();
  const oneDay = 60 * 60 * 24 * 1000;
  return now - createdDate > oneDay;
};

cron.schedule(DAILY_CRON_SCHEDULE, async () => {
  //Get users that referrals is not empty
  const users = await ServiceClientSchema.find({ referrals: { $ne: [] } });
  //Filter users, and get where referrals isPaid is false and return userId and name
  const usersToBePaid = users.filter((user) => {
    return user.referrals.some((referral) => {
      return referral.paid === false;
    });
  });
});
