// Simple API response helpers
exports.ok = (res, data = {}) => res.json({ success: true, ...data });
exports.fail = (res, status = 400, message = 'Error', errors = []) =>
  res.status(status).json({ success: false, message, errors });
