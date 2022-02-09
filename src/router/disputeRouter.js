const disputeRoute = require("../core/routerConfig");
const disputeController = require("../controller/disputeController");
const { authenticate, permit } = require("../core/userAuth");
const { ADMIN_ROLES, USER_TYPE } = require("../utils/constants");

disputeRoute
  .route("/disputes")
  .post(
    authenticate,
    permit([USER_TYPE.SERVICE_CLIENT]),
    disputeController.createDispute
  )
  .get(permit(Object.keys(ADMIN_ROLES)), authenticate, disputeController.getAllDisputes);

disputeRoute
  .route("/disputes/:id")
  .get(permit(Object.keys(ADMIN_ROLES)), authenticate, disputeController.getDisputeById)

module.exports = disputeRoute;
