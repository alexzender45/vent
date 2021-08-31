const categoryRoute = require("../core/routerConfig");
const categoryController = require("../controller/categoryController");
const { authenticate, permit } = require("../core/userAuth");
const { ADMIN_ROLES } = require("../utils/constants");

categoryRoute
  .route("/categories")
  .post(
    authenticate,
    permit(Object.keys(ADMIN_ROLES)),
    categoryController.create
  )
  .get(categoryController.getAllCategory);

categoryRoute
  .route("/categories/:id")
  .get(categoryController.getCategoryById)
  .delete(
    authenticate,
    permit(Object.keys(ADMIN_ROLES)),
    categoryController.deleteCategory
  );

categoryRoute
  .route("/categories/:type")
  .get(categoryController.getCategoryByType);

module.exports = categoryRoute;
