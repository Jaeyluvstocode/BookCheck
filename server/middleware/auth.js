const jwt = require('jsonwebtoken');
const api = require('../utils/api');

module.exports = (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return api.fail(res, 401, 'No token, authorization denied');
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    return api.fail(res, 401, 'Token is not valid');
  }
};
