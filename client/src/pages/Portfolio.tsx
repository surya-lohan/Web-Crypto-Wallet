import React, { useState, useEffect } from 'react';
import { useWallet } from '../context';
import { useCrypto } from '../context';
import { PieChart, TrendingUp, TrendingDown, DollarSign, Minus, Plus, Eye, EyeOff, RefreshCw } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

interface PortfolioCoin {
  symbol: string;
  name: string;
  amount: number;
  value: number;
  currentPrice: number;
  averageBuyPrice: number;
  profitLoss: number;
  profitLossPercentage: number;
  allocation: number;
}

const Portfolio: React.FC = () => {
  const { wallet, loading: walletLoading, fetchWallet, sellCryptocurrency } = useWallet();
  const { loading: pricesLoading, fetchPrices } = useCrypto();
  const [showBalances, setShowBalances] = useState(true);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<PortfolioCoin | null>(null);
  const [sellAmount, setSellAmount] = useState('');
  const [sellPrice, setSellPrice] = useState('');

  useEffect(() => {
    fetchWallet();
    if (wallet?.currencies && wallet.currencies.length > 0) {
      const symbols = wallet.currencies.map(c => c.symbol.toLowerCase());
      fetchPrices(symbols);
    }
  }, []);

  const portfolioCoins: PortfolioCoin[] = React.useMemo(() => {
    if (!wallet?.currencies) return [];
    
    const totalValue = wallet.totalPortfolioValue || 0;
    
    return wallet.currencies.map(currency => ({
      symbol: currency.symbol,
      name: currency.name,
      amount: currency.amount,
      value: currency.value,
      currentPrice: currency.currentPrice,
      averageBuyPrice: currency.averageBuyPrice,
      profitLoss: currency.profitLoss,
      profitLossPercentage: currency.profitLossPercentage,
      allocation: totalValue > 0 ? (currency.value / totalValue) * 100 : 0
    }));
  }, [wallet]);

  const formatCurrency = (amount: number) => {
    if (!showBalances) return '••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatCrypto = (amount: number, symbol: string) => {
    if (!showBalances) return '••••••';
    return `${amount.toFixed(8)} ${symbol.toUpperCase()}`;
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

  const handleSell = async () => {
    if (!selectedCoin || !sellAmount || !sellPrice) return;

    try {
      const amount = parseFloat(sellAmount);
      const price = parseFloat(sellPrice);

      await sellCryptocurrency({
        symbol: selectedCoin.symbol,
        amount,
        price
      });

      setShowSellModal(false);
      setSellAmount('');
      setSellPrice('');
      setSelectedCoin(null);
      fetchWallet(); // Refresh wallet data
    } catch (error) {
      console.error('Sell error:', error);
    }
  };

  const getTotalStats = () => {
    const totalValue = wallet?.totalPortfolioValue || 0;
    const totalProfitLoss = wallet?.totalProfitLoss || 0;
    const totalProfitLossPercentage = wallet?.totalProfitLossPercentage || 0;
    
    return { totalValue, totalProfitLoss, totalProfitLossPercentage };
  };

  const { totalValue, totalProfitLoss, totalProfitLossPercentage } = getTotalStats();

  if (walletLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Portfolio</h1>
          <p className="text-gray-600">Track your cryptocurrency investments and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBalances(!showBalances)}
            className="btn btn-ghost"
          >
            {showBalances ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <button
            onClick={() => {
              fetchWallet();
              if (portfolioCoins.length > 0) {
                const symbols = portfolioCoins.map(c => c.symbol.toLowerCase());
                fetchPrices(symbols);
              }
            }}
            disabled={walletLoading || pricesLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(walletLoading || pricesLoading) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Portfolio Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">24h Profit/Loss</p>
              <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalances ? (
                  totalProfitLoss >= 0 ? `+${formatCurrency(totalProfitLoss)}` : formatCurrency(totalProfitLoss)
                ) : '••••••'}
              </p>
            </div>
            {totalProfitLoss >= 0 ? 
              <TrendingUp className="w-8 h-8 text-green-600" /> : 
              <TrendingDown className="w-8 h-8 text-red-600" />
            }
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">24h Profit/Loss %</p>
              <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {showBalances ? formatPercentage(totalProfitLossPercentage) : '••••••'}
              </p>
            </div>
            <PieChart className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      {portfolioCoins.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profit/Loss
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocation
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolioCoins.map((coin) => (
                  <tr key={coin.symbol} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-bold text-blue-600">
                            {coin.symbol.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{coin.name}</div>
                          <div className="text-sm text-gray-500">{coin.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCrypto(coin.amount, coin.symbol)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(coin.currentPrice)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(coin.value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div>
                        <div className={coin.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {showBalances ? (
                            coin.profitLoss >= 0 ? `+${formatCurrency(coin.profitLoss)}` : formatCurrency(coin.profitLoss)
                          ) : '••••••'}
                        </div>
                        <div className="text-xs">
                          {formatPercentage(coin.profitLossPercentage)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${coin.allocation}%` }}
                          />
                        </div>
                        <span>{coin.allocation.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <button
                        onClick={() => {
                          setSelectedCoin(coin);
                          setSellPrice(coin.currentPrice.toString());
                          setShowSellModal(true);
                        }}
                        className="p-1 text-red-600 hover:text-red-700 rounded"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 text-center">
          <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Holdings Yet</h2>
          <p className="text-gray-600 mb-6">
            Start building your cryptocurrency portfolio by purchasing your first coins.
          </p>
          <button className="btn btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Buy Cryptocurrency
          </button>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && selectedCoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Sell {selectedCoin.name}</h3>
            
            <div className="mb-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-sm font-bold text-blue-600">
                    {selectedCoin.symbol.charAt(0)}
                  </span>
                </div>
                <span className="font-medium">{selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})</span>
              </div>
              <div className="text-sm text-gray-600">
                Available: {formatCrypto(selectedCoin.amount, selectedCoin.symbol)}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount to sell
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={sellAmount}
                onChange={(e) => setSellAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.00000001"
                min="0"
                max={selectedCoin.amount}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sell price per unit
              </label>
              <input
                type="number"
                placeholder="0.00"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                step="0.01"
                min="0"
              />
            </div>

            {sellAmount && sellPrice && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">Total proceeds:</div>
                <div className="text-lg font-bold">
                  {formatCurrency(parseFloat(sellAmount) * parseFloat(sellPrice))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowSellModal(false);
                  setSellAmount('');
                  setSellPrice('');
                  setSelectedCoin(null);
                }}
                className="flex-1 btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSell}
                disabled={!sellAmount || !sellPrice || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > selectedCoin.amount}
                className="flex-1 btn btn-danger disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sell
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;