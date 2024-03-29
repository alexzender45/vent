const jwt = require("jsonwebtoken");
const forge = require("node-forge");
const { JWT_SECRETE_KEY, TOKEN_DURATION } = require("./config");
const {
  throwError,
  handleCastErrorExceptionForInvalidObjectId,
  isCastError,
} = require("../utils/handleErrors");
const { error } = require("../utils/baseController");
const { USER_TYPE, ADMIN_ROLES, ACCESS } = require("../utils/constants");
const ServiceClient = require("../models/serviceClientModel");
const ServiceProvider = require("../models/serviceProviderModel");

// Generate Authorization Token
async function generateAuthToken(payload) {
  return jwt.sign(payload, JWT_SECRETE_KEY, { expiresIn: TOKEN_DURATION });
}

// checking if a user has a token
const authenticate = async (req, res, next) => {
  try {
    const jwtPayload = decodeJwtToken(req);
    const user = await getUserPayload(jwtPayload);
    req.token = jwtPayload.token;
    req.user = user;
    next();
  } catch (e) {
    return error(res, { code: 401, message: e.message });
  }
};

// Decoding Jwt token
function decodeJwtToken(req) {
  const requestHeaderAuthorization = req.headers.authorization;
  if (!requestHeaderAuthorization) {
    throwError("Authentication Failed. Please login", 401);
  }

  const [authBearer, token] = requestHeaderAuthorization.split(" ");

  if (authBearer !== "Bearer") {
    throwError("Authentication Failed", 401);
  }

  const jwtPayload = verifyToken(token);

  jwtPayload.token = token;
  return jwtPayload;
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRETE_KEY, { expiresIn: TOKEN_DURATION });
}

async function getUserPayload(payload) {
  const userId = payload.userId;
  return payload.userType === USER_TYPE.SERVICE_CLIENT
    ? getServiceClientPayload(userId)
    : getServiceProviderPayload(userId);
}

async function getServiceClientPayload(userId) {
  return await ServiceClient.findOne({ _id: userId })
    .orFail(() =>
      throwError("Access denied. Please login or create an account", 401)
    )
    .catch((error) =>
      isCastError(error) ? handleCastErrorExceptionForInvalidObjectId() : error
    );
}

async function getServiceProviderPayload(userId) {
  return await ServiceProvider.findOne({ _id: userId })
    .orFail(() =>
      throwError("Access denied. Please login or create an account", 401)
    )
    .catch((error) =>
      isCastError(error) ? handleCastErrorExceptionForInvalidObjectId() : error
    );
}

// Permission for users
function permit(roles) {
  return (req, res, next) => {
    const isAuthorized = roles.includes(req.user.userType);

    if (!isAuthorized) {
      return error(res, {
        code: 403,
        message: "Unauthorized Access. Contact the admin.",
      });
    }

    next();
  };
}

function isAdmin(roles, access) {
  return (req, res, next) => {
    const jwtPayload = decodeJwtToken(req);
    const isAuthorized = roles.includes(jwtPayload.role) && access.includes(jwtPayload.access) && jwtPayload.status !== false;
    if (!isAuthorized) {
      return error(res, {
        code: 403,
        message:
          "Unauthorized Access. Contact the admin. You are not authorized to perform this action",
      });
    }

    next();
  };
}

function restrict(users) {
  return (req, res, next) => {
    const isRestricted = users.includes(req.user.isActive);

    if (!isRestricted) {
      return error(res, {
        code: 403,
        message:
          "Sorry You Can Not Perform This Action Your Account is De-activated",
      });
    }

    next();
  };
}

function encrypt(key, text) {
  var cipher = forge.cipher.createCipher(
    "3DES-ECB",
    forge.util.createBuffer(key)
  );
  cipher.start({ iv: "" });
  cipher.update(forge.util.createBuffer(text, "utf-8"));
  cipher.finish();
  var encrypted = cipher.output;
  return forge.util.encode64(encrypted.getBytes());
}

module.exports = {
  authenticate,
  permit,
  generateAuthToken,
  isAdmin,
  restrict,
  verifyToken,
  encrypt,
};
