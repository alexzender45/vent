const bankRoute = require('../core/routerConfig');
const bankController = require('../controller/bankController');
const { authenticate, permit } = require('../core/userAuth');
const { USER_TYPE } = require('../utils/constants');

bankRoute.route('/banks')
    .post(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.addBank);

bankRoute.route('/banks/resolve-account')
    .post(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.resolveAccountDetails);

bankRoute.route('/banks')
    .get(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.getAllBanks);

bankRoute.route('/banks/list')
    .get(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.getBankList);

bankRoute.route('/banks/:id')
    .get(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.getBank)
    .put(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.makeDefaultBank)
    .delete(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), bankController.deleteBank);

module.exports = bankRoute;
