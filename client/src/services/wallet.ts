import apiService from './api';
import type { 
  Wallet, 
  Transaction, 
  PortfolioHistory, 
  BuyOrderData, 
  SellOrderData, 
  WalletSettings,
  TransactionParams,
  PaginationData
} from '../types';

class WalletService {
  /**
   * Get user's wallet information
   */
  async getWallet(): Promise<Wallet> {
    const response = await apiService.get<{ wallet: Wallet }>('/wallet');
    
    if (response.success && response.data) {
      return response.data.wallet;
    }
    
    throw new Error(response.message || 'Failed to fetch wallet');
  }

  /**
   * Buy cryptocurrency
   */
  async buyCryptocurrency(orderData: BuyOrderData): Promise<{ transaction: Transaction; wallet: Partial<Wallet> }> {
    const response = await apiService.post<{ transaction: Transaction; wallet: Partial<Wallet> }>('/wallet/buy', orderData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to buy cryptocurrency');
  }

  /**
   * Sell cryptocurrency
   */
  async sellCryptocurrency(orderData: SellOrderData): Promise<{ transaction: Transaction; wallet: Partial<Wallet> }> {
    const response = await apiService.post<{ transaction: Transaction; wallet: Partial<Wallet> }>('/wallet/sell', orderData);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to sell cryptocurrency');
  }

  /**
   * Get transaction history
   */
  async getTransactions(params?: TransactionParams): Promise<{ transactions: Transaction[]; pagination: PaginationData }> {
    const response = await apiService.get<{ transactions: Transaction[]; pagination: PaginationData }>('/wallet/transactions', params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch transactions');
  }

  /**
   * Get portfolio history
   */
  async getPortfolioHistory(days = 30): Promise<{
    portfolioHistory: PortfolioHistory[];
    currentValue: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
  }> {
    const response = await apiService.get<{
      portfolioHistory: PortfolioHistory[];
      currentValue: number;
      totalProfitLoss: number;
      totalProfitLossPercentage: number;
    }>('/wallet/portfolio-history', { days });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch portfolio history');
  }

  /**
   * Update wallet settings
   */
  async updateWalletSettings(settings: Partial<WalletSettings>): Promise<WalletSettings> {
    const response = await apiService.put<{ settings: WalletSettings }>('/wallet/settings', settings);
    
    if (response.success && response.data) {
      return response.data.settings;
    }
    
    throw new Error(response.message || 'Failed to update wallet settings');
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    const response = await apiService.get<{ transaction: Transaction }>(`/wallet/transactions/${transactionId}`);
    
    if (response.success && response.data) {
      return response.data.transaction;
    }
    
    throw new Error(response.message || 'Failed to fetch transaction');
  }

  /**
   * Calculate portfolio metrics
   */
  calculatePortfolioMetrics(wallet: Wallet) {
    const totalInvested = wallet.currencies.reduce((total, currency) => 
      total + (currency.amount * currency.averageBuyPrice), 0
    );
    
    const currentValue = wallet.currencies.reduce((total, currency) => 
      total + currency.value, 0
    );
    
    const totalProfitLoss = currentValue - totalInvested;
    const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;
    
    return {
      totalInvested,
      currentValue,
      totalProfitLoss,
      totalProfitLossPercentage
    };
  }

  /**
   * Format currency amount
   */
  formatCurrency(amount: number, currency = 'USD', decimals = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(amount);
  }

  /**
   * Format cryptocurrency amount
   */
  formatCrypto(amount: number, symbol: string, decimals = 8): string {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: decimals
    }).format(amount);
    
    return `${formatted} ${symbol}`;
  }

  /**
   * Format percentage change
   */
  formatPercentage(percentage: number, decimals = 2): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(decimals)}%`;
  }

  /**
   * Get color for profit/loss display
   */
  getProfitLossColor(value: number): string {
    if (value > 0) return '#22c55e'; // green
    if (value < 0) return '#ef4444'; // red
    return '#6b7280'; // gray
  }
}

// Create and export singleton instance
const walletService = new WalletService();
export default walletService;