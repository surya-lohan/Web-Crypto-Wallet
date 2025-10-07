export interface Currency {
  symbol: string;
  name: string;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  value: number;
  profitLoss: number;
  profitLossPercentage: number;
}

export interface Wallet {
  id: string;
  user: string;
  totalBalance: number;
  totalPortfolioValue: number;
  totalProfitLoss: number;
  totalProfitLossPercentage: number;
  currencies: Currency[];
  settings: WalletSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface WalletSettings {
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR';
  notifications: {
    priceAlerts: boolean;
    portfolioUpdates: boolean;
    transactionConfirmations: boolean;
  };
  privacy: {
    hideBalances: boolean;
    publicProfile: boolean;
  };
}

export interface Transaction {
  id: string;
  user: string;
  wallet: string;
  type: 'buy' | 'sell' | 'send' | 'receive' | 'deposit' | 'withdraw';
  cryptocurrency: {
    symbol: string;
    name: string;
    amount: number;
    price: number;
  };
  fiat: {
    currency: string;
    amount: number;
  };
  fees: {
    amount: number;
    currency: string;
  };
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  transactionHash?: string;
  fromAddress?: string;
  toAddress?: string;
  blockNumber?: number;
  confirmations: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PortfolioHistory {
  date: Date;
  totalValue: number;
  currencies: {
    symbol: string;
    amount: number;
    price: number;
    value: number;
  }[];
}

export interface BuyOrderData {
  symbol: string;
  name: string;
  amount: number;
  price: number;
  fiatAmount: number;
  notes?: string;
}

export interface SellOrderData {
  symbol: string;
  amount: number;
  price: number;
  notes?: string;
}

export interface WalletContextType {
  wallet: Wallet | null;
  transactions: Transaction[];
  portfolioHistory: PortfolioHistory[];
  loading: boolean;
  fetchWallet: () => Promise<void>;
  fetchTransactions: (params?: TransactionParams) => Promise<void>;
  fetchPortfolioHistory: (days?: number) => Promise<void>;
  buyCryptocurrency: (data: BuyOrderData) => Promise<void>;
  sellCryptocurrency: (data: SellOrderData) => Promise<void>;
  updateWalletSettings: (settings: Partial<WalletSettings>) => Promise<void>;
}

export interface TransactionParams {
  type?: string;
  cryptocurrency?: string;
  status?: string;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}