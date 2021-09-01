const {throwError} = require("./handleErrors");
const { EMAIL_SENDER } = require("../core/config");

exports.validateParameters = (expectedParameters, actualParameters) => {
  const messages = [];
  let isValid = true;

  if(!actualParameters){
      throwError("Invalid Parameters")
  }

  expectedParameters.forEach((parameter) => {
    const actualParameter = actualParameters[parameter];

    if (!actualParameter || actualParameter === '') {
      messages.push(`${parameter} is required`);
      isValid = false;
    }
  });
  return { isValid, messages };
};

exports.sendEmail = (to, subject, html) => {
  return { from: EMAIL_SENDER, to, subject, html}
}

exports.performUpdate = async (updates, newDetails, allowedUpdates, oldDetails) => {
    let invalidField;
    const isValidUpdate = updates.every(update => {
        if (newDetails[update] === '') throwError(`Invalid value supplied for ${update}`)
        invalidField = update;
        return allowedUpdates.includes(update);
    });

    if (!isValidUpdate) {
        throwError(`Invalid Field ${invalidField}`);
    }

    updates.map(update => {
        oldDetails[update] = newDetails[update];
    });

    return await oldDetails.save();
}