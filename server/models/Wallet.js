const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalBalance: {
    type: Number,
    default: 0,
    min: [0, 'Total balance cannot be negative']
  },
  currencies: [{
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
      min: [0, 'Currency amount cannot be negative']
    },
    averageBuyPrice: {
      type: Number,
      default: 0,
      min: [0, 'Average buy price cannot be negative']
    },
    currentPrice: {
      type: Number,
      default: 0,
      min: [0, 'Current price cannot be negative']
    },
    value: {
      type: Number,
      default: 0,
      min: [0, 'Value cannot be negative']
    },
    profitLoss: {
      type: Number,
      default: 0
    },
    profitLossPercentage: {
      type: Number,
      default: 0
    }
  }],
  portfolioHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    totalValue: {
      type: Number,
      required: true,
      min: [0, 'Total value cannot be negative']
    },
    currencies: [{
      symbol: String,
      amount: Number,
      price: Number,
      value: Number
    }]
  }],
  settings: {
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'JPY', 'INR']
    },
    notifications: {
      priceAlerts: {
        type: Boolean,
        default: true
      },
      portfolioUpdates: {
        type: Boolean,
        default: true
      },
      transactionConfirmations: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      hideBalances: {
        type: Boolean,
        default: false
      },
      publicProfile: {
        type: Boolean,
        default: false
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true }
});

// Virtual for total portfolio value
walletSchema.virtual('totalPortfolioValue').get(function() {
  return this.currencies.reduce((total, currency) => total + currency.value, 0);
});

// Virtual for total profit/loss
walletSchema.virtual('totalProfitLoss').get(function() {
  return this.currencies.reduce((total, currency) => total + currency.profitLoss, 0);
});

// Virtual for total profit/loss percentage
walletSchema.virtual('totalProfitLossPercentage').get(function() {
  const totalInvestment = this.currencies.reduce((total, currency) => 
    total + (currency.amount * currency.averageBuyPrice), 0);
  
  if (totalInvestment === 0) return 0;
  
  const totalCurrentValue = this.currencies.reduce((total, currency) => 
    total + currency.value, 0);
  
  return ((totalCurrentValue - totalInvestment) / totalInvestment) * 100;
});

// Method to add or update currency
walletSchema.methods.addOrUpdateCurrency = function(currencyData) {
  const { symbol, name, amount, price } = currencyData;
  
  const existingCurrency = this.currencies.find(c => c.symbol === symbol);
  
  if (existingCurrency) {
    // Update existing currency (for buying more)
    const totalAmount = existingCurrency.amount + amount;
    const totalCost = (existingCurrency.amount * existingCurrency.averageBuyPrice) + (amount * price);
    
    existingCurrency.amount = totalAmount;
    existingCurrency.averageBuyPrice = totalCost / totalAmount;
    existingCurrency.currentPrice = price;
    existingCurrency.value = totalAmount * price;
    existingCurrency.profitLoss = existingCurrency.value - (totalAmount * existingCurrency.averageBuyPrice);
    existingCurrency.profitLossPercentage = existingCurrency.averageBuyPrice > 0 
      ? ((price - existingCurrency.averageBuyPrice) / existingCurrency.averageBuyPrice) * 100 
      : 0;
  } else {
    // Add new currency
    this.currencies.push({
      symbol,
      name,
      amount,
      averageBuyPrice: price,
      currentPrice: price,
      value: amount * price,
      profitLoss: 0,
      profitLossPercentage: 0
    });
  }
};

// Method to update currency prices
walletSchema.methods.updateCurrencyPrices = function(priceData) {
  this.currencies.forEach(currency => {
    const newPrice = priceData[currency.symbol];
    if (newPrice) {
      currency.currentPrice = newPrice;
      currency.value = currency.amount * newPrice;
      currency.profitLoss = currency.value - (currency.amount * currency.averageBuyPrice);
      currency.profitLossPercentage = currency.averageBuyPrice > 0 
        ? ((newPrice - currency.averageBuyPrice) / currency.averageBuyPrice) * 100 
        : 0;
    }
  });
};

// Method to record portfolio snapshot
walletSchema.methods.recordPortfolioSnapshot = function() {
  const snapshot = {
    date: new Date(),
    totalValue: this.totalPortfolioValue,
    currencies: this.currencies.map(currency => ({
      symbol: currency.symbol,
      amount: currency.amount,
      price: currency.currentPrice,
      value: currency.value
    }))
  };
  
  this.portfolioHistory.push(snapshot);
  
  // Keep only last 365 days of history
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 365);
  this.portfolioHistory = this.portfolioHistory.filter(
    record => record.date >= cutoffDate
  );
};

// Index for better query performance
walletSchema.index({ user: 1 });
walletSchema.index({ 'currencies.symbol': 1 });
walletSchema.index({ 'portfolioHistory.date': -1 });

module.exports = mongoose.model('Wallet', walletSchema);