const serviceProviderRoute = require('../core/routerConfig');
const serviceProviderController = require('../controller/serviceProviderController');
const { authenticate, permit } = require('../core/userAuth');
const { USER_TYPE } = require('../utils/constants');

serviceProviderRoute.route('/service/providers')
    .post(serviceProviderController.signup)
    .get(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), serviceProviderController.getServiceProviderProfile)
    .put(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), serviceProviderController.updateServiceProviderDetails);

serviceProviderRoute.route('/service/providers/all')
    .get(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), serviceProviderController.getAllServiceProvider);

serviceProviderRoute.route('/service/providers/login')
    .post(serviceProviderController.login);

serviceProviderRoute.route('/service/providers/forgot-password')
    .post(serviceProviderController.forgotPassword);

serviceProviderRoute.route('/service/providers/reset-password')
    .post(serviceProviderController.resetPassword);

serviceProviderRoute.route('/service/providers/change-password')
    .post(authenticate, permit([USER_TYPE.SERVICE_PROVIDER]), serviceProviderController.changePassword);

module.exports = serviceProviderRoute;
