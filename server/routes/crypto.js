const express = require('express');
const axios = require('axios');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// CoinGecko API configuration
const COINGECKO_API = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';
const API_KEY = process.env.COINAPI_KEY;

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: COINGECKO_API,
  timeout: 10000,
  headers: API_KEY ? {
    'x-cg-demo-api-key': API_KEY
  } : {}
});

// Mock cryptocurrency data (for development without API keys)
const mockCryptoData = {
  'BTC': {
    symbol: 'BTC',
    name: 'Bitcoin',
    current_price: 43250.75,
    price_change_24h: 1850.32,
    price_change_percentage_24h: 4.47,
    market_cap: 845123456789,
    volume_24h: 28543123456,
    circulating_supply: 19542187,
    total_supply: 21000000,
    max_supply: 21000000,
    image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png'
  },
  'ETH': {
    symbol: 'ETH',
    name: 'Ethereum',
    current_price: 2678.45,
    price_change_24h: -145.23,
    price_change_percentage_24h: -5.14,
    market_cap: 321567890123,
    volume_24h: 15432109876,
    circulating_supply: 120280312,
    total_supply: 120280312,
    max_supply: null,
    image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png'
  },
  'ADA': {
    symbol: 'ADA',
    name: 'Cardano',
    current_price: 0.4723,
    price_change_24h: 0.0234,
    price_change_percentage_24h: 5.22,
    market_cap: 16543210987,
    volume_24h: 876543210,
    circulating_supply: 35045020830,
    total_supply: 45000000000,
    max_supply: 45000000000,
    image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png'
  },
  'SOL': {
    symbol: 'SOL',
    name: 'Solana',
    current_price: 98.76,
    price_change_24h: 7.43,
    price_change_percentage_24h: 8.13,
    market_cap: 43210987654,
    volume_24h: 2109876543,
    circulating_supply: 437841193,
    total_supply: 567643242,
    max_supply: null,
    image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png'
  },
  'MATIC': {
    symbol: 'MATIC',
    name: 'Polygon',
    current_price: 0.8945,
    price_change_24h: -0.0234,
    price_change_percentage_24h: -2.55,
    market_cap: 8765432109,
    volume_24h: 543210987,
    circulating_supply: 9811233165,
    total_supply: 10000000000,
    max_supply: 10000000000,
    image: 'https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png'
  },
  'DOT': {
    symbol: 'DOT',
    name: 'Polkadot',
    current_price: 7.23,
    price_change_24h: 0.34,
    price_change_percentage_24h: 4.93,
    market_cap: 9876543210,
    volume_24h: 654321098,
    circulating_supply: 1365938542,
    total_supply: 1432129285,
    max_supply: null,
    image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png'
  }
};

// Generate mock price history
const generateMockPriceHistory = (currentPrice, days = 30) => {
  const history = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Generate realistic price fluctuation (±5% daily)
    const fluctuation = (Math.random() - 0.5) * 0.1; // ±5%
    const basePrice = currentPrice * (1 - (days - i) * 0.001); // Slight downward trend for realism
    const price = basePrice * (1 + fluctuation);
    
    history.push([
      date.getTime(),
      Math.max(price, 0.01) // Ensure price doesn't go negative
    ]);
  }
  
  return history;
};

/**
 * @route   GET /api/crypto/prices
 * @desc    Get cryptocurrency prices
 * @access  Private
 */
router.get('/prices', async (req, res) => {
  try {
    const { symbols, currency = 'usd' } = req.query;
    
    // Try CoinGecko API first
    try {
      const symbolList = symbols ? symbols.split(',').join(',') : 'bitcoin,ethereum,cardano,solana,matic-network,polkadot';
      const response = await apiClient.get('/simple/price', {
        params: {
          ids: symbolList,
          vs_currencies: currency,
          include_24hr_change: true,
          include_market_cap: true,
          include_24hr_vol: true
        }
      });
      
      return res.json({
        success: true,
        data: response.data,
        source: 'coingecko_api'
      });
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError.message);
      // Continue to fallback below
    }

    // Fallback to mock data if API fails
    console.log('Using mock data fallback for prices');
    const requestedSymbols = symbols ? symbols.split(',') : Object.keys(mockCryptoData);
    const prices = {};

    requestedSymbols.forEach(symbol => {
      const upperSymbol = symbol.toUpperCase();
      if (mockCryptoData[upperSymbol]) {
        prices[symbol.toLowerCase()] = {
          [currency]: mockCryptoData[upperSymbol].current_price,
          [`${currency}_24h_change`]: mockCryptoData[upperSymbol].price_change_percentage_24h,
          [`${currency}_market_cap`]: mockCryptoData[upperSymbol].market_cap,
          [`${currency}_24h_vol`]: mockCryptoData[upperSymbol].volume_24h
        };
      }
    });

    res.json({
      success: true,
      data: prices,
      source: 'mock_data_fallback'
    });

  } catch (error) {
    console.error('Get prices error:', error);
    res.status(500).json({
      error: 'Failed to fetch prices',
      message: 'Unable to retrieve cryptocurrency prices'
    });
  }
});

/**
 * @route   GET /api/crypto/market
 * @desc    Get market data for popular cryptocurrencies
 * @access  Private
 */
router.get('/market', async (req, res) => {
  try {
    const { page = 1, per_page = 50, currency = 'usd' } = req.query;

    // Try CoinGecko API first
    try {
      const response = await apiClient.get('/coins/markets', {
        params: {
          vs_currency: currency,
          order: 'market_cap_desc',
          per_page: Math.min(per_page, 250), // CoinGecko limit
          page,
          sparkline: false,
          price_change_percentage: '24h,7d'
        }
      });
      
      return res.json({
        success: true,
        data: response.data,
        source: 'coingecko_api'
      });
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError.message);
      // Continue to fallback below
    }

    // Fallback to mock market data
    console.log('Using mock data fallback for market data');
    const marketData = Object.values(mockCryptoData).map((crypto, index) => ({
      id: crypto.name.toLowerCase().replace(/\s+/g, '-'),
      symbol: crypto.symbol.toLowerCase(),
      name: crypto.name,
      image: crypto.image,
      current_price: crypto.current_price,
      market_cap: crypto.market_cap,
      market_cap_rank: index + 1,
      fully_diluted_valuation: crypto.market_cap,
      total_volume: crypto.volume_24h,
      high_24h: crypto.current_price * 1.05,
      low_24h: crypto.current_price * 0.95,
      price_change_24h: crypto.price_change_24h,
      price_change_percentage_24h: crypto.price_change_percentage_24h,
      market_cap_change_24h: crypto.market_cap * (crypto.price_change_percentage_24h / 100),
      market_cap_change_percentage_24h: crypto.price_change_percentage_24h,
      circulating_supply: crypto.circulating_supply,
      total_supply: crypto.total_supply,
      max_supply: crypto.max_supply,
      ath: crypto.current_price * 2.5,
      ath_change_percentage: -60,
      ath_date: '2021-11-10T14:24:11.849Z',
      atl: crypto.current_price * 0.1,
      atl_change_percentage: 900,
      atl_date: '2020-03-13T02:31:00.000Z',
      last_updated: new Date().toISOString()
    }));

    res.json({
      success: true,
      data: marketData,
      source: 'mock_data_fallback'
    });

  } catch (error) {
    console.error('Get market data error:', error);
    res.status(500).json({
      error: 'Failed to fetch market data',
      message: 'Unable to retrieve market data'
    });
  }
});

/**
 * @route   GET /api/crypto/chart/:symbol
 * @desc    Get price chart data for a cryptocurrency
 * @access  Private
 */
router.get('/chart/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { days = 30, currency = 'usd' } = req.query;

    // Create a mapping from symbol to CoinGecko ID
    const symbolToId = {
      'btc': 'bitcoin',
      'eth': 'ethereum', 
      'ada': 'cardano',
      'sol': 'solana',
      'matic': 'matic-network',
      'dot': 'polkadot'
    };

    const coinId = symbolToId[symbol.toLowerCase()] || symbol.toLowerCase();

    // Try CoinGecko API first
    try {
      const response = await apiClient.get(`/coins/${coinId}/market_chart`, {
        params: {
          vs_currency: currency,
          days,
          interval: days <= 1 ? 'hourly' : 'daily'
        }
      });
      
      return res.json({
        success: true,
        data: {
          prices: response.data.prices,
          market_caps: response.data.market_caps,
          total_volumes: response.data.total_volumes
        },
        source: 'coingecko_api'
      });
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError.message);
      // Continue to fallback below
    }

    // Fallback to mock chart data
    console.log('Using mock data fallback for chart data');
    const upperSymbol = symbol.toUpperCase();
    const cryptoData = mockCryptoData[upperSymbol];
    
    if (!cryptoData) {
      return res.status(404).json({
        error: 'Cryptocurrency not found',
        message: `No data available for ${symbol.toUpperCase()}`
      });
    }

    const prices = generateMockPriceHistory(cryptoData.current_price, parseInt(days));
    const market_caps = prices.map(([timestamp, price]) => [
      timestamp,
      price * cryptoData.circulating_supply
    ]);
    const total_volumes = prices.map(([timestamp, price]) => [
      timestamp,
      price * cryptoData.circulating_supply * 0.1 // Mock volume as 10% of market cap
    ]);

    res.json({
      success: true,
      data: {
        prices,
        market_caps,
        total_volumes,
        symbol: upperSymbol,
        name: cryptoData.name
      },
      source: 'mock_data_fallback'
    });

  } catch (error) {
    console.error('Get chart data error:', error);
    res.status(500).json({
      error: 'Failed to fetch chart data',
      message: 'Unable to retrieve chart data'
    });
  }
});

/**
 * @route   GET /api/crypto/search
 * @desc    Search for cryptocurrencies
 * @access  Private
 */
router.get('/search', async (req, res) => {
  try {
    const { q: query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        error: 'Invalid query',
        message: 'Search query must be at least 2 characters long'
      });
    }

    // Try CoinGecko API first
    try {
      const response = await apiClient.get('/search', {
        params: { query }
      });
      
      return res.json({
        success: true,
        data: response.data,
        source: 'coingecko_api'
      });
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError.message);
      // Continue to fallback below
    }

    // Fallback to mock search results
    console.log('Using mock data fallback for search');
    const searchQuery = query.toLowerCase();
    const results = Object.values(mockCryptoData)
      .filter(crypto => 
        crypto.name.toLowerCase().includes(searchQuery) || 
        crypto.symbol.toLowerCase().includes(searchQuery)
      )
      .map(crypto => ({
        id: crypto.name.toLowerCase().replace(/\s+/g, '-'),
        name: crypto.name,
        symbol: crypto.symbol,
        market_cap_rank: 1,
        thumb: crypto.image,
        large: crypto.image
      }));

    res.json({
      success: true,
      data: {
        coins: results
      },
      source: 'mock_data_fallback'
    });

  } catch (error) {
    console.error('Search cryptocurrencies error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'Unable to search cryptocurrencies'
    });
  }
});

/**
 * @route   GET /api/crypto/trending
 * @desc    Get trending cryptocurrencies
 * @access  Private
 */
router.get('/trending', async (req, res) => {
  try {
    // Try CoinGecko API first
    try {
      const response = await apiClient.get('/search/trending');
      
      return res.json({
        success: true,
        data: response.data,
        source: 'coingecko_api'
      });
    } catch (apiError) {
      console.error('CoinGecko API error:', apiError.message);
      // Continue to fallback below
    }

    // Fallback to mock trending data
    console.log('Using mock data fallback for trending');
    const trending = {
      coins: Object.values(mockCryptoData)
        .sort(() => 0.5 - Math.random()) // Randomize order
        .slice(0, 7)
        .map((crypto, index) => ({
          item: {
            id: crypto.name.toLowerCase().replace(/\s+/g, '-'),
            coin_id: index + 1,
            name: crypto.name,
            symbol: crypto.symbol,
            market_cap_rank: index + 1,
            thumb: crypto.image,
            small: crypto.image,
            large: crypto.image,
            slug: crypto.name.toLowerCase().replace(/\s+/g, '-'),
            price_btc: crypto.current_price / mockCryptoData.BTC.current_price,
            score: Math.floor(Math.random() * 100)
          }
        }))
    };

    res.json({
      success: true,
      data: trending,
      source: 'mock_data_fallback'
    });

  } catch (error) {
    console.error('Get trending cryptocurrencies error:', error);
    res.status(500).json({
      error: 'Failed to fetch trending data',
      message: 'Unable to retrieve trending cryptocurrencies'
    });
  }
});

module.exports = router;