const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const validator = require('validator');
const uniqueValidator = require('mongoose-unique-validator');
const { throwError } = require("../utils/handleErrors");
const { GENDER, USER_TYPE, ROLE, ACCOUNT_TYPE } = require('../utils/constants');
const { SUPPORTED_PHONE_FORMAT } = require('../core/config')

const serviceProviderSchema
 = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    dateOfBirth: {
      type: Date
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid Email!');
        }
        return validator.isEmail(value);
      },
    },
    phoneNumber: {
      type: String,
      unique: true,
      validate(value) {
        if (!validator.isMobilePhone(value, SUPPORTED_PHONE_FORMAT)) {
          throw new Error('Invalid Phone Number!');
        }
        return validator.isMobilePhone(value);
      },
    },
    password: {
      type: String
    },
    profilePictureUrl: {
      type: String,
    },
    location: {
      type: String,
    },
    token: {
      type: String,
    },
    userType: {
      type: String,
      enum: Object.keys(USER_TYPE),
      default: USER_TYPE.SERVICE_PROVIDER,
    },
    gender: {
      type: String,
      enum: Object.keys(GENDER)
    },
    accountType: {
      type: String,
      enum: Object.keys(ACCOUNT_TYPE),
      default: ACCOUNT_TYPE.VENT_ACCOUNT,
    },
    role: {
      type: String,
      default: ROLE.USER,
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
    toObject: {
      transform(doc, ref) {
        delete ref.password;
        delete ref.tokens;
      },
    },
  },
  {
    strictQuery: 'throw'
  }
);

serviceProviderSchema
.pre('save', async function save(next) {
  try {
    const user = this;

    if (!user.isModified('password')) {
      return next();
    }
      user.password = await bcrypt.hash(user.password, 10);
    next();
  } catch (e) {
    next(e);
  }
});

serviceProviderSchema
.statics.findByCredentials = async (loginId, password) => {
  const user = await ServiceProviderModel.findOne({ $or: [{ phoneNumber: loginId }, { email: loginId }] }).orFail(() => throwError('Invalid Login Details', 404));
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throwError('Incorrect Password');
  }
  return user;
};

serviceProviderSchema
.plugin(uniqueValidator, { message: '{TYPE} must be unique.' });

const ServiceProviderModel = model('ServiceProvider', serviceProviderSchema);
module.exports = ServiceProviderModel;
