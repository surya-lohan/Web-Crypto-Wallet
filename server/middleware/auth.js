const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate JWT tokens and protect routes
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied',
        message: 'No token provided. Please login to access this resource.' 
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found. Please login again.' 
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ 
        error: 'Account disabled',
        message: 'Your account has been disabled. Please contact support.' 
      });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid. Please login again.' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again.' 
      });
    }
    
    res.status(500).json({ 
      error: 'Server error',
      message: 'Authentication failed due to server error.' 
    });
  }
};

/**
 * Middleware to generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: 'CryptoWallet',
      audience: 'CryptoWallet-Users'
    }
  );
};

/**
 * Middleware to refresh JWT token
 */
const refreshToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided',
        message: 'Refresh token is required' 
      });
    }

    // Verify the current token (even if expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    // Check if token is close to expiry (within 1 day)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = decoded.exp - now;
    
    if (timeUntilExpiry > 86400) { // More than 1 day left
      return res.status(400).json({
        error: 'Token still valid',
        message: 'Token refresh not needed yet'
      });
    }

    // Get user and generate new token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid user',
        message: 'Cannot refresh token for invalid or inactive user' 
      });
    }

    const newToken = generateToken(user._id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Token refresh failed',
      message: 'Unable to refresh token. Please login again.' 
    });
  }
};

/**
 * Middleware to check if user owns the resource
 */
const checkResourceOwnership = (resourceField = 'user') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req.params.userId || req.body[resourceField] || req.query[resourceField];
      
      if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          error: 'Access forbidden',
          message: 'You can only access your own resources'
        });
      }
      
      next();
    } catch (error) {
      console.error('Resource ownership check error:', error);
      res.status(500).json({
        error: 'Server error',
        message: 'Unable to verify resource ownership'
      });
    }
  };
};

/**
 * Middleware to log API requests (for development)
 */
const logRequest = (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - User: ${req.user ? req.user.username : 'Anonymous'}`);
  }
  next();
};

module.exports = {
  authenticateToken,
  generateToken,
  refreshToken,
  checkResourceOwnership,
  logRequest
};