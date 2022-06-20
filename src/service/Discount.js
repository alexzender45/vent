const discountSchema = require("../models/discountModel");
const userDiscountSchema = require("../models/userDiscountModel");
const { throwError } = require("../utils/handleErrors");
const { validateParameters } = require("../utils/util");

class Admin {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  async getAll() {
    const { offset, limit } = this.data;
    const discounts = await discountSchema
      .find()
      .limit(limit)
      .skip(limit * offset);

    if (!discounts.length) {
      throwError("Discount not found", 404);
    }
    return discounts;
  }

  async getOne() {
    const id = this.data;
    const discounts = await discountSchema.findOne({_id: id})

    if (!discounts) {
      throwError("Discount not found", 404);
    }
    return discounts;
  }

  async add() {
    const { isValid, messages } = validateParameters(
      ["name", "type", "code", "discount", "timeframe"],
      this.data
    );
    if (!isValid) {
      throwError(messages);
    }

    var now = new Date();
    now.setDate(now.getDate() + parseInt(this.data.timeframe));
    try{
    return await new discountSchema({...this.data, timeframe: now}).save();
    }catch(error){
      const messages = "Cannot have the same discount code"
      throwError(messages)
    }
  }

  async deleteOne() {
    const id = this.data;
    const discount = await discountSchema.deleteOne({_id: id})
    await userDiscountSchema.deleteOne({discountId: id})
    if(discount.n == 0){
      throwError("This discount does not exist")
    }
    return `${id} deleted `;
  }

  async userDiscount() {
    const { isValid, messages } = validateParameters(
      ["userId", "discountId"],
      this.data
    );
    if (!isValid) {
      throwError(messages);
    }

    const isPresent = await userDiscountSchema.find({ $and: 
      [
        {userId:this.data.userId},
        {discountId: this.data.discountId}
      ]
      })

      if(isPresent.length){
        throwError("You can't use the same token twice")
      }
      
    try{
    return await new userDiscountSchema(this.data).save();
    }catch(error){
      const messages = "Something went wrong in the db write"
      throwError(messages)
    }
  }

  async getUser() {
    const { offset, limit } = this.data;
    const discounts = await userDiscountSchema
      .find()
      .limit(limit)
      .skip(limit * offset)
      .populate('discountId');

    if (!discounts.length) {
      throwError("Discount not found", 404);
    }
    return discounts;
  }

  async referalDiscount() {
    const id = this.data;
    const isPresent = await userDiscountSchema.find({ $and: 
      [
        {userId:id},
        {used: false}
      ]
      }).populate('discountId')

    if (!isPresent.length) {
      return null
    }


    const now = new Date();
    const timeframe = isPresent[0].discountId.timeframe
    const isExpired = now > timeframe

    if(isExpired){
      return null
    }
    
    const p = {...isPresent[0]._doc, used:true}
    const update = await userDiscountSchema.updateOne(
      { _id: isPresent[0]._id},
      { $set: {...isPresent[0]._doc, used:true}}
  );

    return isPresent[0].discountId.discount;
  }


}

module.exports = Admin;
