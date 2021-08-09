const serviceClientRoute = require('../core/routerConfig');
const serviceClientController = require('../controller/serviceClientController');
const { authenticate, permit } = require('../core/userAuth');
const { USER_TYPE } = require('../utils/constants');

serviceClientRoute.route('/service/clients')
    .post(serviceClientController.signup)
    .get(authenticate, permit([USER_TYPE.SERVICE_CLIENT]), serviceClientController.serviceClientProfile)
    .put(authenticate, permit([USER_TYPE.SERVICE_CLIENT]), serviceClientController.updateServiceClientDetails);

serviceClientRoute.route('/service/clients/all')
    .get(authenticate, permit([USER_TYPE.SERVICE_CLIENT]), serviceClientController.getAllServiceClient);

serviceClientRoute.route('/service/clients/login')
    .post(serviceClientController.login);

serviceClientRoute.route('/service/clients/forgot-password')
    .post(serviceClientController.forgotPassword);

serviceClientRoute.route('/service/clients/reset-password')
    .post(serviceClientController.resetPassword);

serviceClientRoute.route('/service/clients/change-password')
    .post(authenticate, permit([USER_TYPE.SERVICE_CLIENT]), serviceClientController.changePassword);

module.exports = serviceClientRoute;
