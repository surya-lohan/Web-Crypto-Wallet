export interface CryptocurrencyPrice {
  symbol: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

export interface ChartData {
  prices: [number, number][]; // [timestamp, price]
  market_caps: [number, number][];
  total_volumes: [number, number][];
  symbol: string;
  name: string;
}

export interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  large: string;
}

export interface TrendingCoin {
  item: {
    id: string;
    coin_id: number;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    small: string;
    large: string;
    slug: string;
    price_btc: number;
    score: number;
  };
}

export interface CryptoContextType {
  prices: Record<string, CryptocurrencyPrice>;
  marketData: MarketData[];
  trendingCoins: TrendingCoin[];
  loading: boolean;
  fetchPrices: (symbols?: string[]) => Promise<void>;
  fetchMarketData: (page?: number, perPage?: number) => Promise<void>;
  fetchChartData: (symbol: string, days?: number) => Promise<ChartData>;
  searchCryptocurrency: (query: string) => Promise<SearchResult[]>;
  fetchTrendingCoins: () => Promise<void>;
  error: string | null;
}