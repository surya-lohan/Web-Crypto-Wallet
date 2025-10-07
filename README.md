# Crypto Wallet - Full Stack MERN Application

A modern, full-featured cryptocurrency wallet built with the MERN stack (MongoDB, Express.js, React.js, Node.js) for managing digital assets, tracking portfolio performance, and trading cryptocurrencies.

## 🌟 Features

### Core Functionality
- **User Authentication**: Secure registration, login, and JWT-based authentication
- **Portfolio Management**: Track cryptocurrency holdings with real-time profit/loss calculations
- **Live Market Data**: Real-time cryptocurrency prices and market information via CoinGecko API
- **Trading Interface**: Buy and sell cryptocurrencies with transaction history
- **Dashboard**: Comprehensive overview of portfolio performance and market highlights
- **Settings**: User profile management, notification preferences, and security settings

### Technical Features
- **Responsive Design**: Modern UI with Tailwind CSS and glassmorphism effects
- **Real-time Updates**: Live price feeds and portfolio updates
- **Secure API**: JWT authentication, input validation, and security middleware
- **TypeScript Support**: Type-safe frontend development
- **Context API**: Efficient state management across the application
- **Modern Architecture**: Clean separation of concerns with service layers

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Context API** for state management
- **Axios** for HTTP requests
- **Lucide React** for icons
- **Framer Motion** for animations

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **Helmet** for security headers
- **CORS** for cross-origin requests
- **Rate limiting** for API protection

### External APIs
- **CoinGecko API** for cryptocurrency market data
- **Mock API** endpoints for development

## 📁 Project Structure

```
CryptoWallet/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   ├── contexts/           # React Context providers
│   │   │   ├── AuthContext.tsx
│   │   │   ├── WalletContext.tsx
│   │   │   └── CryptoContext.tsx
│   │   ├── pages/              # Main application pages
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── Market.tsx
│   │   │   └── Settings.tsx
│   │   ├── services/           # API service layers
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── wallet.ts
│   │   │   └── crypto.ts
│   │   ├── types/              # TypeScript type definitions
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx             # Main application component
│   │   └── main.tsx            # Application entry point
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
├── server/                     # Express Backend
│   ├── models/                 # MongoDB data models
│   │   ├── User.js
│   │   ├── Wallet.js
│   │   └── Transaction.js
│   ├── routes/                 # API route handlers
│   │   ├── auth.js
│   │   ├── wallet.js
│   │   └── crypto.js
│   ├── middleware/             # Custom middleware
│   │   └── auth.js
│   ├── server.js               # Express server setup
│   ├── package.json
│   └── .env                    # Environment variables
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn package manager

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/cryptowallet.git
cd cryptowallet
```

### 2. Backend Setup
```bash
cd server
npm install

# Create .env file with the following variables:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cryptowallet
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
NODE_ENV=development

# Optional: CoinGecko API (for production)
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Start the server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../client
npm install

# Create .env file (optional):
VITE_API_URL=http://localhost:5000/api

# Start the development server
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📱 Usage Guide

### Getting Started
1. **Register**: Create a new account with username, email, and password
2. **Login**: Access your account with your credentials
3. **Dashboard**: View your portfolio overview and market highlights
4. **Market**: Browse cryptocurrencies and execute buy orders
5. **Portfolio**: Monitor your holdings and sell positions
6. **Settings**: Customize your preferences and manage security

### Key Features

#### Market Trading
- Browse live cryptocurrency prices
- Search for specific cryptocurrencies
- Sort by price, market cap, or 24h change
- Execute buy orders with real-time pricing
- Add coins to your watchlist

#### Portfolio Management
- View all cryptocurrency holdings
- Track profit/loss in real-time
- Monitor portfolio allocation
- Execute sell orders
- Hide/show balance for privacy

#### Transaction History
- Complete transaction records
- Buy/sell history with timestamps
- Transaction status tracking
- Detailed transaction information

#### Settings & Security
- Profile management
- Password changes
- Notification preferences
- Privacy settings
- Account deletion

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Wallet Management
- `GET /api/wallet` - Get user wallet
- `POST /api/wallet/buy` - Buy cryptocurrency
- `POST /api/wallet/sell` - Sell cryptocurrency
- `GET /api/wallet/transactions` - Get transaction history
- `PUT /api/wallet/settings` - Update wallet settings
- `GET /api/wallet/portfolio-history` - Get portfolio history

### Cryptocurrency Data
- `GET /api/crypto/prices` - Get cryptocurrency prices
- `GET /api/crypto/market` - Get market data
- `GET /api/crypto/chart/:symbol` - Get price chart data
- `GET /api/crypto/search` - Search cryptocurrencies
- `GET /api/crypto/trending` - Get trending cryptocurrencies

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Express-validator for API input sanitization
- **Rate Limiting**: Protection against API abuse
- **CORS Configuration**: Secure cross-origin resource sharing
- **Security Headers**: Helmet.js for security headers
- **Environment Variables**: Sensitive data protection

## 🎨 UI/UX Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern Interface**: Clean, intuitive user interface
- **Dark/Light Theme**: Adaptive design elements
- **Loading States**: Smooth loading indicators
- **Error Handling**: User-friendly error messages
- **Accessibility**: WCAG compliant design patterns
- **Animations**: Smooth transitions and micro-interactions

## 🚀 Deployment

### Production Build
```bash
# Backend
cd server
npm run start

# Frontend
cd client
npm run build
npm run preview
```

### Environment Variables (Production)
```bash
# Backend (.env)
NODE_ENV=production
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_production_jwt_secret
COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Frontend (.env.production)
VITE_API_URL=https://your-backend-domain.com/api
```

### Deployment Platforms
- **Backend**: Heroku, Railway, DigitalOcean, AWS
- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Database**: MongoDB Atlas, AWS DocumentDB

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd server
npm test

# Frontend tests
cd client
npm test
```

### Test Coverage
- Unit tests for utility functions
- Integration tests for API endpoints
- Component tests for React components
- End-to-end tests for user workflows

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **CoinGecko** for cryptocurrency market data
- **Tailwind CSS** for the styling framework
- **Lucide React** for beautiful icons
- **MongoDB** for the database solution
- **React Team** for the amazing frontend framework

## 📞 Support

For support, email support@cryptowallet.com or create an issue in the GitHub repository.

## 🗺️ Roadmap

### Phase 1 (Current)
- ✅ Basic wallet functionality
- ✅ User authentication
- ✅ Portfolio tracking
- ✅ Market data integration

### Phase 2 (Future)
- 🔄 Advanced charting
- 🔄 Price alerts
- 🔄 DeFi integration
- 🔄 Multi-currency support

### Phase 3 (Future)
- 🔄 Mobile application
- 🔄 Advanced trading features
- 🔄 Social features
- 🔄 API for third-party developers

---

**Built with ❤️ for the crypto community**