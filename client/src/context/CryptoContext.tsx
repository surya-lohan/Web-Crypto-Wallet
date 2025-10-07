import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { cryptoService } from '../services';
import type { 
  CryptoContextType, 
  CryptocurrencyPrice, 
  MarketData, 
  ChartData, 
  SearchResult, 
  TrendingCoin 
} from '../types';

// Crypto state type
interface CryptoState {
  prices: Record<string, CryptocurrencyPrice>;
  marketData: MarketData[];
  trendingCoins: TrendingCoin[];
  isLoading: boolean;
}

// Crypto actions
type CryptoAction =
  | { type: 'CRYPTO_LOADING'; payload: boolean }
  | { type: 'SET_PRICES'; payload: Record<string, CryptocurrencyPrice> }
  | { type: 'SET_MARKET_DATA'; payload: MarketData[] }
  | { type: 'SET_TRENDING_COINS'; payload: TrendingCoin[] }
  | { type: 'UPDATE_PRICE'; payload: { symbol: string; price: CryptocurrencyPrice } };

// Initial state
const initialState: CryptoState = {
  prices: {},
  marketData: [],
  trendingCoins: [],
  isLoading: false,
};

// Crypto reducer
const cryptoReducer = (state: CryptoState, action: CryptoAction): CryptoState => {
  switch (action.type) {
    case 'CRYPTO_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_PRICES':
      return {
        ...state,
        prices: { ...state.prices, ...action.payload },
        isLoading: false,
      };
    case 'SET_MARKET_DATA':
      return {
        ...state,
        marketData: action.payload,
        isLoading: false,
      };
    case 'SET_TRENDING_COINS':
      return {
        ...state,
        trendingCoins: action.payload,
      };
    case 'UPDATE_PRICE':
      return {
        ...state,
        prices: {
          ...state.prices,
          [action.payload.symbol]: action.payload.price,
        },
      };
    default:
      return state;
  }
};

// Create context
const CryptoContext = createContext<CryptoContextType | undefined>(undefined);

// Crypto provider component
export const CryptoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cryptoReducer, initialState);

  // Auto-refresh prices every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (Object.keys(state.prices).length > 0) {
        fetchPrices(Object.keys(state.prices));
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [state.prices]);

  // Fetch cryptocurrency prices
  const fetchPrices = async (symbols?: string[]): Promise<void> => {
    dispatch({ type: 'CRYPTO_LOADING', payload: true });
    
    try {
      const prices = await cryptoService.getPrices(symbols);
      dispatch({ type: 'SET_PRICES', payload: prices });
    } catch (error) {
      console.error('Failed to fetch prices:', error);
      dispatch({ type: 'CRYPTO_LOADING', payload: false });
      throw error;
    }
  };

  // Fetch market data
  const fetchMarketData = async (page = 1, perPage = 50): Promise<void> => {
    dispatch({ type: 'CRYPTO_LOADING', payload: true });
    
    try {
      const marketData = await cryptoService.getMarketData(page, perPage);
      dispatch({ type: 'SET_MARKET_DATA', payload: marketData });
    } catch (error) {
      console.error('Failed to fetch market data:', error);
      dispatch({ type: 'CRYPTO_LOADING', payload: false });
      throw error;
    }
  };

  // Fetch chart data
  const fetchChartData = async (symbol: string, days = 30): Promise<ChartData> => {
    try {
      return await cryptoService.getChartData(symbol, days);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      throw error;
    }
  };

  // Search cryptocurrencies
  const searchCryptocurrency = async (query: string): Promise<SearchResult[]> => {
    try {
      return await cryptoService.searchCryptocurrency(query);
    } catch (error) {
      console.error('Failed to search cryptocurrencies:', error);
      throw error;
    }
  };

  // Fetch trending coins
  const fetchTrendingCoins = async (): Promise<void> => {
    try {
      const trendingCoins = await cryptoService.getTrendingCoins();
      dispatch({ type: 'SET_TRENDING_COINS', payload: trendingCoins });
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      throw error;
    }
  };

  const contextValue: CryptoContextType = {
    prices: state.prices,
    marketData: state.marketData,
    trendingCoins: state.trendingCoins,
    loading: state.isLoading,
    fetchPrices,
    fetchMarketData,
    fetchChartData,
    searchCryptocurrency,
    fetchTrendingCoins,
    error: null
  };

  return (
    <CryptoContext.Provider value={contextValue}>
      {children}
    </CryptoContext.Provider>
  );
};

// Hook to use crypto context
export const useCrypto = (): CryptoContextType => {
  const context = useContext(CryptoContext);
  if (context === undefined) {
    throw new Error('useCrypto must be used within a CryptoProvider');
  }
  return context;
};

export default CryptoContext;