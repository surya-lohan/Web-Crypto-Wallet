import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { walletService } from '../services';
import { useAuth } from './AuthContext';
import type { 
  WalletContextType, 
  Wallet, 
  Transaction, 
  PortfolioHistory, 
  BuyOrderData, 
  SellOrderData, 
  WalletSettings,
  TransactionParams 
} from '../types';

// Wallet state type
interface WalletState {
  wallet: Wallet | null;
  transactions: Transaction[];
  portfolioHistory: PortfolioHistory[];
  isLoading: boolean;
}

// Wallet actions
type WalletAction =
  | { type: 'WALLET_LOADING'; payload: boolean }
  | { type: 'SET_WALLET'; payload: Wallet }
  | { type: 'UPDATE_WALLET'; payload: Partial<Wallet> }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'SET_PORTFOLIO_HISTORY'; payload: PortfolioHistory[] }
  | { type: 'CLEAR_WALLET' };

// Initial state
const initialState: WalletState = {
  wallet: null,
  transactions: [],
  portfolioHistory: [],
  isLoading: false,
};

// Wallet reducer
const walletReducer = (state: WalletState, action: WalletAction): WalletState => {
  switch (action.type) {
    case 'WALLET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_WALLET':
      return {
        ...state,
        wallet: action.payload,
        isLoading: false,
      };
    case 'UPDATE_WALLET':
      return {
        ...state,
        wallet: state.wallet ? { ...state.wallet, ...action.payload } : null,
      };
    case 'SET_TRANSACTIONS':
      return {
        ...state,
        transactions: action.payload,
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case 'SET_PORTFOLIO_HISTORY':
      return {
        ...state,
        portfolioHistory: action.payload,
      };
    case 'CLEAR_WALLET':
      return initialState;
    default:
      return state;
  }
};

// Create context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Wallet provider component
export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(walletReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Clear wallet data when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'CLEAR_WALLET' });
    }
  }, [isAuthenticated]);

  // Fetch wallet data
  const fetchWallet = async (): Promise<void> => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'WALLET_LOADING', payload: true });
    
    try {
      const wallet = await walletService.getWallet();
      dispatch({ type: 'SET_WALLET', payload: wallet });
    } catch (error) {
      console.error('Failed to fetch wallet:', error);
      dispatch({ type: 'WALLET_LOADING', payload: false });
      throw error;
    }
  };

  // Fetch transactions
  const fetchTransactions = async (params?: TransactionParams): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      const response = await walletService.getTransactions(params);
      dispatch({ type: 'SET_TRANSACTIONS', payload: response.transactions });
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
      throw error;
    }
  };

  // Fetch portfolio history
  const fetchPortfolioHistory = async (days = 30): Promise<void> => {
    if (!isAuthenticated) return;
    
    try {
      const response = await walletService.getPortfolioHistory(days);
      dispatch({ type: 'SET_PORTFOLIO_HISTORY', payload: response.portfolioHistory });
    } catch (error) {
      console.error('Failed to fetch portfolio history:', error);
      throw error;
    }
  };

  // Buy cryptocurrency
  const buyCryptocurrency = async (data: BuyOrderData): Promise<void> => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'WALLET_LOADING', payload: true });
    
    try {
      const response = await walletService.buyCryptocurrency(data);
      
      // Update wallet with new data
      dispatch({ type: 'UPDATE_WALLET', payload: response.wallet });
      
      // Add new transaction to the list
      dispatch({ type: 'ADD_TRANSACTION', payload: response.transaction });
      
      dispatch({ type: 'WALLET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'WALLET_LOADING', payload: false });
      throw error;
    }
  };

  // Sell cryptocurrency
  const sellCryptocurrency = async (data: SellOrderData): Promise<void> => {
    if (!isAuthenticated) return;
    
    dispatch({ type: 'WALLET_LOADING', payload: true });
    
    try {
      const response = await walletService.sellCryptocurrency(data);
      
      // Update wallet with new data
      dispatch({ type: 'UPDATE_WALLET', payload: response.wallet });
      
      // Add new transaction to the list
      dispatch({ type: 'ADD_TRANSACTION', payload: response.transaction });
      
      dispatch({ type: 'WALLET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'WALLET_LOADING', payload: false });
      throw error;
    }
  };

  // Update wallet settings
  const updateWalletSettings = async (settings: Partial<WalletSettings>): Promise<void> => {
    if (!isAuthenticated || !state.wallet) return;
    
    try {
      const updatedSettings = await walletService.updateWalletSettings(settings);
      dispatch({ 
        type: 'UPDATE_WALLET', 
        payload: { 
          settings: { ...state.wallet.settings, ...updatedSettings } 
        } 
      });
    } catch (error) {
      throw error;
    }
  };

  const contextValue: WalletContextType = {
    wallet: state.wallet,
    transactions: state.transactions,
    portfolioHistory: state.portfolioHistory,
    loading: state.isLoading,
    fetchWallet,
    fetchTransactions,
    fetchPortfolioHistory,
    buyCryptocurrency,
    sellCryptocurrency,
    updateWalletSettings,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Hook to use wallet context
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export default WalletContext;