const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const api = require('../utils/api');

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return api.fail(res, 400, 'Validation failed', errors.array());
    const { username, email, password } = req.body;
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return api.fail(res, 400, 'User already exists');
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashed });
    await user.save();
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.status(201);
    return api.ok(res, { message: 'User registered', token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    return api.fail(res, 500, 'Registration failed');
  }
};

exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return api.fail(res, 400, 'Validation failed', errors.array());
    // allow login with either username or email
    const { username, email, password } = req.body;
    const user = await User.findOne(email ? { email } : { username });
    if (!user) return api.fail(res, 400, 'Invalid username or password');
    const match = await bcrypt.compare(password, user.password);
    if (!match) return api.fail(res, 400, 'Invalid username or password');
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    return api.ok(res, { message: 'Login successful', token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error(err);
    return api.fail(res, 500, 'Login failed');
  }
};
