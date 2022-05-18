const bcrypt = require('bcrypt');
const { Schema, model } = require('mongoose');
const validator = require('validator');
const uniqueValidator = require('mongoose-unique-validator');
const { throwError } = require("../utils/handleErrors");
const { GENDER, ADMIN_ROLES, ACCESS } = require('../utils/constants');
const { SUPPORTED_PHONE_FORMAT } = require('../core/config')

const adminSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    gender: {
      type: String,
      enum: Object.keys(GENDER)
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
    },
    image: {
      type: String,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    status: {
      type: Boolean,
      default: false,
    },
    token: {
        type: String,
      },
    role: {
      type: String,
      enum: Object.keys(ADMIN_ROLES),
      required: true,
    },
    access: {
      type: String,
      enum: Object.keys(ACCESS),
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
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

adminSchema.pre('save', async function save(next) {
    try {
      const admin = this;
  
      if (!admin.isModified('password')) {
        return next();
      }
        admin.password = await bcrypt.hash(admin.password, 10);
      next();
    } catch (e) {
      next(e);
    }
  });
  
  adminSchema.statics.findByCredentials = async (loginId, password) => {
    const admin = await AdminModel.findOne({ 
        $or: [{ phoneNumber: loginId }, 
            { email: loginId }] })
            .orFail(() => throwError('Invalid Login Details', 404));
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throwError('Incorrect Password');
    }
    return admin;
  };
  
  adminSchema.plugin(uniqueValidator, { message: '{TYPE} must be unique.' });
  
  const AdminModel = model('Admin', adminSchema);
  module.exports = AdminModel;
