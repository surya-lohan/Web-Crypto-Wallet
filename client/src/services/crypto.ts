import apiService from './api';
import type { 
  CryptocurrencyPrice, 
  MarketData, 
  ChartData, 
  SearchResult, 
  TrendingCoin 
} from '../types';

class CryptoService {
  /**
   * Get cryptocurrency prices
   */
  async getPrices(symbols?: string[], currency = 'usd'): Promise<Record<string, CryptocurrencyPrice>> {
    const params: any = { currency };
    if (symbols && symbols.length > 0) {
      params.symbols = symbols.join(',');
    }
    
    const response = await apiService.get<Record<string, CryptocurrencyPrice>>('/crypto/prices', params);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch cryptocurrency prices');
  }

  /**
   * Get market data for cryptocurrencies
   */
  async getMarketData(page = 1, perPage = 50, currency = 'usd'): Promise<MarketData[]> {
    const response = await apiService.get<MarketData[]>('/crypto/market', {
      page,
      per_page: perPage,
      currency
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch market data');
  }

  /**
   * Get price chart data for a cryptocurrency
   */
  async getChartData(symbol: string, days = 30, currency = 'usd'): Promise<ChartData> {
    const response = await apiService.get<ChartData>(`/crypto/chart/${symbol}`, {
      days,
      currency
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error(response.message || 'Failed to fetch chart data');
  }

  /**
   * Search for cryptocurrencies
   */
  async searchCryptocurrency(query: string): Promise<SearchResult[]> {
    if (query.length < 2) {
      return [];
    }
    
    const response = await apiService.get<{ coins: SearchResult[] }>('/crypto/search', { q: query });
    
    if (response.success && response.data) {
      return response.data.coins;
    }
    
    throw new Error(response.message || 'Failed to search cryptocurrencies');
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const response = await apiService.get<{ coins: TrendingCoin[] }>('/crypto/trending');
    
    if (response.success && response.data) {
      return response.data.coins;
    }
    
    throw new Error(response.message || 'Failed to fetch trending cryptocurrencies');
  }

  /**
   * Format large numbers (for market cap, volume)
   */
  formatLargeNumber(value: number): string {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(2)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `$${(value / 1e3).toFixed(2)}K`;
    } else {
      return `$${value.toFixed(2)}`;
    }
  }

  /**
   * Format price with appropriate decimal places
   */
  formatPrice(price: number, currency = 'USD'): string {
    let decimals = 2;
    
    // Use more decimals for very small prices
    if (price < 0.01) {
      decimals = 8;
    } else if (price < 1) {
      decimals = 4;
    }
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(price);
  }

  /**
   * Format percentage change with color coding
   */
  formatPercentageChange(percentage: number): { 
    formatted: string; 
    color: string; 
    isPositive: boolean 
  } {
    const isPositive = percentage >= 0;
    const sign = isPositive ? '+' : '';
    const formatted = `${sign}${percentage.toFixed(2)}%`;
    const color = isPositive ? '#22c55e' : '#ef4444';
    
    return { formatted, color, isPositive };
  }

  /**
   * Get cryptocurrency icon URL
   */
  getCryptoIcon(symbol: string): string {
    // Fallback icon URLs - in production, you might use a service like CoinGecko
    const iconMap: Record<string, string> = {
      BTC: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png',
      ETH: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png',
      ADA: 'https://assets.coingecko.com/coins/images/975/large/cardano.png',
      SOL: 'https://assets.coingecko.com/coins/images/4128/large/solana.png',
      MATIC: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png',
      DOT: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
    };
    
    return iconMap[symbol.toUpperCase()] || `https://via.placeholder.com/32x32/6366f1/ffffff?text=${symbol.charAt(0)}`;
  }

  /**
   * Calculate 24h change in absolute value
   */
  calculate24hChange(currentPrice: number, changePercentage: number): number {
    const previousPrice = currentPrice / (1 + changePercentage / 100);
    return currentPrice - previousPrice;
  }

  /**
   * Check if market is open (crypto markets are always open)
   */
  isMarketOpen(): boolean {
    return true; // Crypto markets are always open
  }

  /**
   * Get market status message
   */
  getMarketStatus(): string {
    return 'Market Open 24/7';
  }

  /**
   * Sort market data by different criteria
   */
  sortMarketData(data: MarketData[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): MarketData[] {
    const sortedData = [...data].sort((a, b) => {
      let aValue: number;
      let bValue: number;
      
      switch (sortBy) {
        case 'market_cap':
          aValue = a.market_cap;
          bValue = b.market_cap;
          break;
        case 'price':
          aValue = a.current_price;
          bValue = b.current_price;
          break;
        case 'change_24h':
          aValue = a.price_change_percentage_24h;
          bValue = b.price_change_percentage_24h;
          break;
        case 'volume':
          aValue = a.total_volume;
          bValue = b.total_volume;
          break;
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        default:
          aValue = a.market_cap_rank;
          bValue = b.market_cap_rank;
          break;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    
    return sortedData;
  }
}

// Create and export singleton instance
const cryptoService = new CryptoService();
export default cryptoService;