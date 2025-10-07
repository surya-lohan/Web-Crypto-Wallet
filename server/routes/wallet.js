const express = require('express');
const { body, validationResult } = require('express-validator');
const Wallet = require('../models/Wallet');
const Transaction = require('../models/Transaction');
const { authenticateToken, checkResourceOwnership } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

/**
 * @route   GET /api/wallet
 * @desc    Get user's wallet information
 * @access  Private
 */
router.get('/', async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id }).populate('user', 'username email walletAddress');

    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user'
      });
    }

    res.json({
      success: true,
      data: {
        wallet: {
          id: wallet._id,
          user: wallet.user,
          totalBalance: wallet.totalBalance,
          totalPortfolioValue: wallet.totalPortfolioValue,
          totalProfitLoss: wallet.totalProfitLoss,
          totalProfitLossPercentage: wallet.totalProfitLossPercentage,
          currencies: wallet.currencies,
          settings: wallet.settings,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({
      error: 'Failed to fetch wallet',
      message: 'Unable to retrieve wallet information'
    });
  }
});

/**
 * @route   POST /api/wallet/buy
 * @desc    Buy cryptocurrency
 * @access  Private
 */
router.post('/buy', [
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Cryptocurrency symbol is required')
    .isLength({ min: 2, max: 10 })
    .withMessage('Symbol must be between 2 and 10 characters'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Cryptocurrency name is required'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be a positive number'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number'),
  body('fiatAmount')
    .isFloat({ min: 0.01 })
    .withMessage('Fiat amount must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const { symbol, name, amount, price, fiatAmount, notes } = req.body;

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user'
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      wallet: wallet._id,
      type: 'buy',
      cryptocurrency: {
        symbol: symbol.toUpperCase(),
        name,
        amount,
        price
      },
      fiat: {
        currency: wallet.settings.currency,
        amount: fiatAmount
      },
      fees: {
        amount: fiatAmount * 0.01, // 1% fee
        currency: wallet.settings.currency
      },
      status: 'completed',
      notes,
      metadata: {
        platform: 'CryptoWallet',
        exchangeRate: price
      }
    });

    // Complete the transaction
    transaction.completeTransaction();
    await transaction.save();

    // Update wallet with new currency
    wallet.addOrUpdateCurrency({
      symbol: symbol.toUpperCase(),
      name,
      amount,
      price
    });

    await wallet.save();

    res.status(201).json({
      success: true,
      message: 'Cryptocurrency purchased successfully',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          cryptocurrency: transaction.cryptocurrency,
          fiat: transaction.fiat,
          fees: transaction.fees,
          status: transaction.status,
          transactionHash: transaction.transactionHash,
          createdAt: transaction.createdAt
        },
        wallet: {
          totalPortfolioValue: wallet.totalPortfolioValue,
          totalProfitLoss: wallet.totalProfitLoss,
          currencies: wallet.currencies
        }
      }
    });

  } catch (error) {
    console.error('Buy cryptocurrency error:', error);
    res.status(500).json({
      error: 'Purchase failed',
      message: 'Unable to complete cryptocurrency purchase'
    });
  }
});

/**
 * @route   POST /api/wallet/sell
 * @desc    Sell cryptocurrency
 * @access  Private
 */
router.post('/sell', [
  body('symbol')
    .trim()
    .notEmpty()
    .withMessage('Cryptocurrency symbol is required'),
  body('amount')
    .isFloat({ min: 0.000001 })
    .withMessage('Amount must be a positive number'),
  body('price')
    .isFloat({ min: 0.01 })
    .withMessage('Price must be a positive number')
], handleValidationErrors, async (req, res) => {
  try {
    const { symbol, amount, price, notes } = req.body;

    // Find user's wallet
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user'
      });
    }

    // Find the currency in wallet
    const currency = wallet.currencies.find(c => c.symbol === symbol.toUpperCase());
    if (!currency) {
      return res.status(400).json({
        error: 'Currency not found',
        message: 'You do not own this cryptocurrency'
      });
    }

    // Check if user has enough balance
    if (currency.amount < amount) {
      return res.status(400).json({
        error: 'Insufficient balance',
        message: `You only have ${currency.amount} ${symbol.toUpperCase()}`
      });
    }

    const fiatAmount = amount * price;

    // Create transaction record
    const transaction = new Transaction({
      user: req.user._id,
      wallet: wallet._id,
      type: 'sell',
      cryptocurrency: {
        symbol: symbol.toUpperCase(),
        name: currency.name,
        amount,
        price
      },
      fiat: {
        currency: wallet.settings.currency,
        amount: fiatAmount
      },
      fees: {
        amount: fiatAmount * 0.01, // 1% fee
        currency: wallet.settings.currency
      },
      status: 'completed',
      notes,
      metadata: {
        platform: 'CryptoWallet',
        exchangeRate: price
      }
    });

    // Complete the transaction
    transaction.completeTransaction();
    await transaction.save();

    // Update wallet - reduce currency amount
    currency.amount -= amount;
    currency.value = currency.amount * currency.currentPrice;
    currency.profitLoss = currency.value - (currency.amount * currency.averageBuyPrice);
    currency.profitLossPercentage = currency.averageBuyPrice > 0 
      ? ((currency.currentPrice - currency.averageBuyPrice) / currency.averageBuyPrice) * 100 
      : 0;

    // Remove currency if amount becomes 0
    if (currency.amount <= 0) {
      wallet.currencies = wallet.currencies.filter(c => c.symbol !== symbol.toUpperCase());
    }

    await wallet.save();

    res.json({
      success: true,
      message: 'Cryptocurrency sold successfully',
      data: {
        transaction: {
          id: transaction._id,
          type: transaction.type,
          cryptocurrency: transaction.cryptocurrency,
          fiat: transaction.fiat,
          fees: transaction.fees,
          status: transaction.status,
          transactionHash: transaction.transactionHash,
          createdAt: transaction.createdAt
        },
        wallet: {
          totalPortfolioValue: wallet.totalPortfolioValue,
          totalProfitLoss: wallet.totalProfitLoss,
          currencies: wallet.currencies
        }
      }
    });

  } catch (error) {
    console.error('Sell cryptocurrency error:', error);
    res.status(500).json({
      error: 'Sale failed',
      message: 'Unable to complete cryptocurrency sale'
    });
  }
});

/**
 * @route   GET /api/wallet/transactions
 * @desc    Get user's transaction history
 * @access  Private
 */
router.get('/transactions', async (req, res) => {
  try {
    const {
      type,
      cryptocurrency,
      status,
      limit = 50,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (page - 1) * limit;
    const sort = sortOrder === 'desc' ? -1 : 1;

    const transactions = await Transaction.getUserTransactions(req.user._id, {
      type,
      cryptocurrency,
      status,
      limit: parseInt(limit),
      skip,
      sortBy,
      sortOrder: sort
    });

    const totalTransactions = await Transaction.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalTransactions / limit);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: 'Unable to retrieve transaction history'
    });
  }
});

/**
 * @route   GET /api/wallet/portfolio-history
 * @desc    Get portfolio value history
 * @access  Private
 */
router.get('/portfolio-history', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user'
      });
    }

    // Filter portfolio history by days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const portfolioHistory = wallet.portfolioHistory
      .filter(record => record.date >= cutoffDate)
      .sort((a, b) => a.date - b.date);

    // If no history, create a current snapshot
    if (portfolioHistory.length === 0) {
      portfolioHistory.push({
        date: new Date(),
        totalValue: wallet.totalPortfolioValue,
        currencies: wallet.currencies.map(c => ({
          symbol: c.symbol,
          amount: c.amount,
          price: c.currentPrice,
          value: c.value
        }))
      });
    }

    res.json({
      success: true,
      data: {
        portfolioHistory,
        currentValue: wallet.totalPortfolioValue,
        totalProfitLoss: wallet.totalProfitLoss,
        totalProfitLossPercentage: wallet.totalProfitLossPercentage
      }
    });

  } catch (error) {
    console.error('Get portfolio history error:', error);
    res.status(500).json({
      error: 'Failed to fetch portfolio history',
      message: 'Unable to retrieve portfolio history'
    });
  }
});

/**
 * @route   PUT /api/wallet/settings
 * @desc    Update wallet settings
 * @access  Private
 */
router.put('/settings', [
  body('currency').optional().isIn(['USD', 'EUR', 'GBP', 'JPY', 'INR']),
  body('notifications.priceAlerts').optional().isBoolean(),
  body('notifications.portfolioUpdates').optional().isBoolean(),
  body('notifications.transactionConfirmations').optional().isBoolean(),
  body('privacy.hideBalances').optional().isBoolean(),
  body('privacy.publicProfile').optional().isBoolean()
], handleValidationErrors, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      return res.status(404).json({
        error: 'Wallet not found',
        message: 'No wallet found for this user'
      });
    }

    // Update settings
    if (req.body.currency) {
      wallet.settings.currency = req.body.currency;
    }

    if (req.body.notifications) {
      wallet.settings.notifications = {
        ...wallet.settings.notifications,
        ...req.body.notifications
      };
    }

    if (req.body.privacy) {
      wallet.settings.privacy = {
        ...wallet.settings.privacy,
        ...req.body.privacy
      };
    }

    await wallet.save();

    res.json({
      success: true,
      message: 'Wallet settings updated successfully',
      data: {
        settings: wallet.settings
      }
    });

  } catch (error) {
    console.error('Update wallet settings error:', error);
    res.status(500).json({
      error: 'Update failed',
      message: 'Unable to update wallet settings'
    });
  }
});

module.exports = router;