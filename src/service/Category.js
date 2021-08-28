const categorySchema = require('../models/categoryModel');
const {throwError} = require("../utils/handleErrors");
const {validateParameters} = require('../utils/util');

class Category {
    constructor(data) {
        this.data = data;
        this.errors = [];
    }

    async create() {
        let parameters = this.data;
        validateParameters(["name", "type"], parameters);

        const category = new categorySchema(parameters);
        let validationError = category.validateSync();
        if (validationError) {
            Object.values(validationError.errors).forEach(e => {
                if (e.reason) this.errors.push(e.reason.message);
                else this.errors.push(e.message.replace('Path ', ''));
            });
            throwError(this.errors)
        }

        return await category.save();
    }

    async getCategory() {
        return await categorySchema.findById(this.data).orFail(() => throwError("Category Not Found", 404));
    }

    async getCategoryByType() {
        return await categorySchema.find({type: this.data}).orFail(() => throwError(`No Category Found For ${type} Type`, 404));
    }

    static async getAllCategories() {
        return await categorySchema.find().orFail(() => throwError('No Category Found', 404));
    }

    async deleteCategory() {
        return await categorySchema.findByIdAndRemove(this.data);
    }

    async updateCategory() {
        throwError("NOT SUPPORTED")
    }
};

module.exports = Category;