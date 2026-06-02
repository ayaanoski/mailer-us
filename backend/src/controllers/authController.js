const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '7d'
    }
  );
};

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'name, email, and password are required'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        message: 'A user with that email already exists'
      });
    }

    const userCount = await User.countDocuments();
    const user = await User.create({
      name,
      email,
      password,
      role: userCount === 0 ? 'Admin' : 'User'
    });

    return res.status(201).json({
      token: signToken(user),
      user: formatUser(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'A user with that email already exists'
      });
    }

    return res.status(500).json({
      message: 'Unable to register user',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: 'email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    return res.json({
      token: signToken(user),
      user: formatUser(user)
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Unable to log in',
      error: error.message
    });
  }
};

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || '';

    if (!authorization.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Authorization token is required'
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is required');
    }

    const token = authorization.slice('Bearer '.length);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id);

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists'
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError'
    ) {
      return res.status(401).json({
        message: 'Invalid or expired authorization token'
      });
    }

    return res.status(500).json({
      message: 'Unable to authenticate request',
      error: error.message
    });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      message: 'Admin access is required'
    });
  }

  return next();
};

module.exports = {
  register,
  login,
  protect,
  adminOnly
};
