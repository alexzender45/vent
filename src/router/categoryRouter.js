const categoryRoute = require("../core/routerConfig");
const categoryController = require("../controller/categoryController");
const { authenticate, permit } = require("../core/userAuth");
const { ADMIN_ROLES } = require("../utils/constants");

categoryRoute
  .route("/categories")
  .post(
    authenticate,
    //permit([ADMIN_ROLES.SUPER_ADMIN]),
    categoryController.create
  )
  .get(authenticate, categoryController.getAllCategory);

categoryRoute
  .route("/categories/:id")
  .get(authenticate, categoryController.getCategoryById)
  .delete(
    authenticate,
    permit([ADMIN_ROLES.SUPER_ADMIN]),
    categoryController.deleteCategory
  );

categoryRoute
  .route("/categories/type/:type")
  .get(authenticate, categoryController.getCategoryByType);

module.exports = categoryRoute;
