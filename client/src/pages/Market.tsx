import React, { useState, useEffect } from 'react';
import { useWallet } from '../context';
import { useCrypto } from '../context';
import { Search, TrendingUp, TrendingDown, Plus, Loader, Star } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface MarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  price_change_24h: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

const Market: React.FC = () => {
  const { marketData, loading, error, fetchMarketData, searchCryptocurrency } = useCrypto();
  const { buyCryptocurrency } = useWallet();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [sortBy, setSortBy] = useState('market_cap_rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<MarketCoin | null>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  useEffect(() => {
    fetchMarketData();
    // Load watchlist from localStorage
    const savedWatchlist = localStorage.getItem('cryptoWatchlist');
    if (savedWatchlist) {
      setWatchlist(JSON.parse(savedWatchlist));
    }
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchTerm.length >= 2) {
        setSearchLoading(true);
        try {
          const results = await searchCryptocurrency(searchTerm);
          setSearchResults(results);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setSearchLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [searchTerm, searchCryptocurrency]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const sortedMarketData = React.useMemo(() => {
    if (!marketData) return [];
    
    return [...marketData].sort((a: MarketCoin, b: MarketCoin) => {
      let aValue: number, bValue: number;
      
      switch (sortBy) {
        case 'name':
          return sortOrder === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        case 'price':
          aValue = a.current_price;
          bValue = b.current_price;
          break;
        case 'change_24h':
          aValue = a.price_change_percentage_24h;
          bValue = b.price_change_percentage_24h;
          break;
        case 'market_cap':
          aValue = a.market_cap;
          bValue = b.market_cap;
          break;
        case 'volume':
          aValue = a.total_volume;
          bValue = b.total_volume;
          break;
        default:
          aValue = a.market_cap_rank;
          bValue = b.market_cap_rank;
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [marketData, sortBy, sortOrder]);

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(8)}`;
    } else if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(2)}M`;
    }
    return `$${marketCap.toLocaleString()}`;
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <span className={`inline-flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {isPositive ? '+' : ''}{percentage.toFixed(2)}%
      </span>
    );
  };

  const toggleWatchlist = (coinId: string) => {
    const newWatchlist = watchlist.includes(coinId)
      ? watchlist.filter(id => id !== coinId)
      : [...watchlist, coinId];
    
    setWatchlist(newWatchlist);
    localStorage.setItem('cryptoWatchlist', JSON.stringify(newWatchlist));
  };

  const handleBuy = async () => {
    if (!selectedCoin || !buyAmount) return;

    try {
      const amount = parseFloat(buyAmount);
      const totalCost = amount * selectedCoin.current_price;

      await buyCryptocurrency({
        symbol: selectedCoin.symbol.toUpperCase(),
        name: selectedCoin.name,
        amount,
        price: selectedCoin.current_price,
        fiatAmount: totalCost
      });

      setShowBuyModal(false);
      setBuyAmount('');
      setSelectedCoin(null);
    } catch (error) {
      console.error('Buy error:', error);
    }
  };

  if (loading && !marketData) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-500 text-xl mb-4">Error loading market data</div>
        <button
          onClick={() => fetchMarketData()}
          className="btn btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Cryptocurrency Market</h1>
        <p className="text-gray-600">Live prices and market data for top cryptocurrencies</p>
      </div>

      {/* Search and Controls */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search cryptocurrencies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
              {searchLoading ? (
                <div className="p-4 text-center">
                  <Loader className="w-5 h-5 animate-spin mx-auto" />
                </div>
              ) : (
                searchResults.map((coin) => (
                  <button
                    key={coin.id}
                    className="w-full p-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100"
                    onClick={() => {
                      setSearchTerm('');
                      setSearchResults([]);
                      // You could navigate to coin detail here
                    }}
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-6 h-6" />
                    <div>
                      <div className="font-medium">{coin.name}</div>
                      <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => fetchMarketData()}
          disabled={loading}
          className="btn btn-secondary"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin mr-2" /> : null}
          Refresh
        </button>
      </div>

      {/* Market Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('market_cap_rank')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Rank
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Name
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('price')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Price
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('change_24h')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    24h Change
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('market_cap')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Market Cap
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('volume')}
                    className="flex items-center gap-1 hover:text-gray-700"
                  >
                    Volume (24h)
                  </button>
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedMarketData.map((coin: MarketCoin) => (
                <tr key={coin.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {coin.market_cap_rank}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={coin.image}
                        alt={coin.name}
                        className="w-8 h-8 rounded-full mr-3"
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{coin.name}</div>
                        <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPrice(coin.current_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatPercentage(coin.price_change_percentage_24h)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMarketCap(coin.market_cap)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMarketCap(coin.total_volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleWatchlist(coin.id)}
                        className={`p-1 rounded ${
                          watchlist.includes(coin.id)
                            ? 'text-yellow-500 hover:text-yellow-600'
                            : 'text-gray-400 hover:text-yellow-500'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${watchlist.includes(coin.id) ? 'fill-current' : ''}`} />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCoin(coin);
                          setShowBuyModal(true);
                        }}
                        className="p-1 text-blue-600 hover:text-blue-700 rounded"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy Modal */}
      {showBuyModal && selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Buy {selectedCoin.name}</h3>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <img src={selectedCoin.image} alt={selectedCoin.name} className="w-8 h-8 mr-2" />
                <span className="font-medium">{selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})</span>
              </div>
              <div className="text-lg font-bold">{formatPrice(selectedCoin.current_price)}</div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to buy
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={buyAmount}
                onChange={(e) => setBuyAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.00000001"
                min="0"
              />
              {buyAmount && (
                <div className="mt-2 text-sm text-gray-600">
                  Total cost: {formatPrice(parseFloat(buyAmount) * selectedCoin.current_price)}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBuyModal(false);
                  setBuyAmount('');
                  setSelectedCoin(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBuy}
                disabled={!buyAmount || parseFloat(buyAmount) <= 0}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Buy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Market;