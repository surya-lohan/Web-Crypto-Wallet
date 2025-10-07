const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  wallet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['buy', 'sell', 'send', 'receive', 'deposit', 'withdraw'],
    lowercase: true
  },
  cryptocurrency: {
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Amount must be positive']
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price must be positive']
    }
  },
  fiat: {
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    amount: {
      type: Number,
      required: true,
      min: [0, 'Fiat amount must be positive']
    }
  },
  fees: {
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Fee amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    }
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    lowercase: true
  },
  transactionHash: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values but ensures uniqueness when not null
  },
  fromAddress: {
    type: String,
    trim: true
  },
  toAddress: {
    type: String,
    trim: true
  },
  blockNumber: {
    type: Number,
    min: [0, 'Block number cannot be negative']
  },
  confirmations: {
    type: Number,
    default: 0,
    min: [0, 'Confirmations cannot be negative']
  },
  gasUsed: {
    type: Number,
    min: [0, 'Gas used cannot be negative']
  },
  gasPrice: {
    type: Number,
    min: [0, 'Gas price cannot be negative']
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    trim: true
  },
  metadata: {
    platform: {
      type: String,
      default: 'CryptoWallet',
      trim: true
    },
    userAgent: {
      type: String,
      trim: true
    },
    ipAddress: {
      type: String,
      trim: true
    },
    exchangeRate: {
      type: Number,
      min: [0, 'Exchange rate cannot be negative']
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for total transaction value including fees
transactionSchema.virtual('totalValue').get(function() {
  return this.fiat.amount + this.fees.amount;
});

// Virtual for profit/loss (for sell transactions)
transactionSchema.virtual('profitLoss').get(function() {
  if (this.type !== 'sell') return null;
  
  // This would need to be calculated based on average buy price
  // For now, return null as it requires additional data
  return null;
});

// Pre-save middleware to generate transaction hash
transactionSchema.pre('save', function(next) {
  if (!this.transactionHash && this.isNew) {
    // Generate a mock transaction hash
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const type = this.type.substring(0, 2);
    const crypto = this.cryptocurrency.symbol.substring(0, 3);
    
    this.transactionHash = `0x${type}${crypto}${timestamp}${random}`.toLowerCase();
  }
  next();
});

// Instance method to complete transaction
transactionSchema.methods.completeTransaction = function() {
  this.status = 'completed';
  this.confirmations = 6; // Mock confirmations
  this.blockNumber = Math.floor(Math.random() * 1000000) + 18000000; // Mock block number
};

// Instance method to fail transaction
transactionSchema.methods.failTransaction = function(reason) {
  this.status = 'failed';
  this.notes = reason || 'Transaction failed';
};

// Static method to get user transaction history
transactionSchema.statics.getUserTransactions = function(userId, options = {}) {
  const {
    type,
    cryptocurrency,
    status,
    limit = 50,
    skip = 0,
    sortBy = 'createdAt',
    sortOrder = -1
  } = options;
  
  const filter = { user: userId };
  
  if (type) filter.type = type;
  if (cryptocurrency) filter['cryptocurrency.symbol'] = cryptocurrency.toUpperCase();
  if (status) filter.status = status;
  
  return this.find(filter)
    .sort({ [sortBy]: sortOrder })
    .limit(limit)
    .skip(skip)
    .populate('user', 'username email firstName lastName')
    .populate('wallet');
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = function(userId, dateRange = {}) {
  const { startDate, endDate } = dateRange;
  const matchStage = { user: mongoose.Types.ObjectId(userId) };
  
  if (startDate || endDate) {
    matchStage.createdAt = {};
    if (startDate) matchStage.createdAt.$gte = startDate;
    if (endDate) matchStage.createdAt.$lte = endDate;
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 },
        totalAmount: { $sum: '$fiat.amount' },
        totalFees: { $sum: '$fees.amount' }
      }
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: '$count' },
        totalVolume: { $sum: '$totalAmount' },
        totalFees: { $sum: '$totalFees' },
        byType: {
          $push: {
            type: '$_id',
            count: '$count',
            totalAmount: '$totalAmount',
            totalFees: '$totalFees'
          }
        }
      }
    }
  ]);
};

// Indexes for better query performance
transactionSchema.index({ user: 1, createdAt: -1 });
transactionSchema.index({ wallet: 1, createdAt: -1 });
transactionSchema.index({ transactionHash: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ 'cryptocurrency.symbol': 1 });

module.exports = mongoose.model('Transaction', transactionSchema);