const axios = require("axios");
const { google } = require("googleapis");
const serviceClientSchema = require("../models/serviceClientModel");
const serviceProviderSchema = require("../models/serviceProviderModel");
const serviceSchema = require("../models/servicesModel");
const orderSchema = require("../models/orderModel");
const adminSchema = require("../models/adminModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");
const { ORDER_STATUS, PAYMENT_STATUS } = require("../utils/constants");


class Admin {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async emailExist() {
    const existingUser = await adminSchema
      .findOne({ email: this.data.email })
      .exec();
    if (existingUser) {
      throwError("Email Already Exist", 301);
      return { emailExist: true, user: existingUser };
    }
    return { emailExist: false };
  }

  async signup() {
    const { isValid, messages } = validateParameters(
      ["fullName", "email", "password", "phoneNumber", "role", "access"],
      this.data
    );
    if (!isValid) {
      throwError(messages);
    }
    await this.emailExist();
    if (this.errors.length) {
      throwError(this.errors);
    }
    return await new adminSchema(this.data).save();
  }

  async login() {
    let { loginId, password } = this.data;
    loginId = loginId.replace(/\s+/g, " ").trim().toLowerCase();
    const validParameters = validateParameters(
      ["loginId", "password"],
      this.data
    );
    const { isValid, messages } = validParameters;
    if (!isValid) {
      throwError(messages);
    }
    const admin = await adminSchema.findByCredentials(loginId, password);
    if(admin.status === false){
        throwError("Your account is not activated yet", 401);
    }
    return admin;
  }

  // get all admins
    async getAllAdmins() {
        const { offset, limit, adminSearch} = this.data;
        const query = {};
        if(adminSearch){
            adminSearch.replace(/\s+/g, " ").trim();
            query.$or = [
              {
                fullName: { $regex: adminSearch, $options: "i" },
                email: { $regex: adminSearch, $options: "i" },
              },
            ];
          }
        return await adminSchema.find({})
            .skip(offset)
            .limit(limit)
        }

    // approve admin
    async approveAdmin() {
        const admin = await adminSchema.findById(this.data).exec();
        if (!admin) {
            throwError("Admin not found", 404);
        }
        admin.status = true;
        return await admin.save();
    }

    // deactivate admin
    async deactivateAdmin() {
        const admin = await adminSchema.findById(this.data).exec();
        if (!admin) {
            throwError("Admin not found", 404);
        }
        admin.status = false;
        return await admin.save();
    }

    // get admin by id
    async getAdminById() {
        const admin = await adminSchema.findById(this.data).exec();
        if (!admin) {
            throwError("Admin not found", 404);
        }
        return admin;
    }

// overview
    async overview() {
            const totalAdmins = await adminSchema.countDocuments({}).exec();
            const totalServiceProviders = await serviceProviderSchema.countDocuments({}).exec();
            const totalServiceClients = await serviceClientSchema.countDocuments({}).exec();
            const totalUsers = totalAdmins + totalServiceProviders + totalServiceClients;
        return {
            totalAdmins,
            totalServiceProviders,
            totalServiceClients,
            totalUsers,
        }
    }

    // group all completed orders by year and month and return the orders details
    async getCompletedOrders() {
        const { offset, limit, year, month } = this.data;

        const orders = await orderSchema.aggregate([
            {
                $match: {
                    status: ORDER_STATUS.COMPLETED,
                    paymentStatus: PAYMENT_STATUS.PAID,
                    createdAt: {
                        $gte: new Date(`${year}-${month}-01`),
                        $lt: new Date(`${year}-${month}-31`),
                    },
                },
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                    },
                    orders: { $push: "$$ROOT" },
                },
            },
            { $sort: { _id: -1 } },
            { $skip: Number(offset) },
            { $limit: Number(limit) },
        ])
        .exec();
        return orders;
    }

    // top service providers based on total orders completed and rating
    async getTopServiceProviders() {
        const { offset, limit } = this.data;
        return await orderSchema.aggregate([
            {
                $match: {
                    status: ORDER_STATUS.COMPLETED,
                    paymentStatus: PAYMENT_STATUS.PAID,
                },
            },
            {
                $group: {
                    _id: "$serviceProvider",
                    totalOrders: { $sum: 1 },
                },
                // populate service provider details
                serviceProvider: {
                    $lookup: {
                        from: "serviceProviders",
                        localField: "_id",
                        foreignField: "_id",
                        as: "serviceProvider",
                    },
                },
                // get the first service provider
                $unwind: {
                    path: "$serviceProvider",
                },
                // get the rating
            },
            {
                $sort: {
                    totalOrders: -1,
                    rating: -1,
                },
            },
            {
                $skip: Number(offset),
            },
            {
                $limit: Number(limit),
            },
        ])
        .exec();
    }

    // recent orders within last 30 days
    async getRecentOrders() {
        const { offset, limit } = this.data;
        return await orderSchema.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $sort: { createdAt: -1 } },
            { $skip: offset },
            { $limit: limit },
        ]).exec();
    }

    // top service based on total orders completed
    async getTopServices() {
        const { offset, limit } = this.data;
        return await serviceSchema.aggregate([
            { $match: { status: true } },
            { $lookup: { from: "orders", localField: "_id", foreignField: "service", as: "orders" } },
            { $unwind: "$orders" },
            { $group: { _id: "$_id", totalOrders: { $sum: 1 } } },
            { $sort: { totalOrders: -1 } },
            { $skip: offset },
            { $limit: limit },
        ]).exec();
    }

    // successful transactions within 7 days
    async getSuccessfulTransactions() {
        const { offset, limit } = this.data;
        return await orderSchema.aggregate([
            { $match: { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } },
            { $match: { status: PAYMENT_STATUS.SUCCESS } },
            { $sort: { createdAt: -1 } },
            { $skip: offset },
            { $limit: limit },
        ]).exec();
    }
}


module.exports = Admin;