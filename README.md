# CryptoTracker - Live Cryptocurrency Price Tracker

A modern, responsive web application that displays real-time cryptocurrency prices, 24-hour changes, and price trend charts. Built with pure HTML, CSS, and JavaScript.

![CryptoTracker Preview](https://via.placeholder.com/1200x600/0a0b0d/3b82f6?text=CryptoTracker+Preview)

## Features

- **Live Price Data**: Fetches real-time cryptocurrency prices from CoinGecko API
- **Multiple Cryptocurrencies**: Tracks 8 popular cryptocurrencies (Bitcoin, Ethereum, BNB, Cardano, Solana, XRP, Polkadot, Dogecoin)
- **Price Charts**: Displays 7-day price trend sparklines for each cryptocurrency
- **24-Hour Statistics**: Shows price changes with color-coded indicators (green for positive, red for negative)
- **Search Functionality**: Real-time search to filter cryptocurrencies by name or symbol
- **Auto-Refresh**: Automatically updates prices every 60 seconds
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop devices
- **Modern UI**: Clean, professional dark theme with smooth animations
- **Comprehensive Data**: Displays market cap, 24h volume, 24h high/low prices

## Tech Stack

### Frontend Technologies
- **HTML5**: Semantic markup structure
- **CSS3**: Modern styling with CSS Grid, Flexbox, and CSS Variables
- **JavaScript (ES6+)**: Async/await, Fetch API, DOM manipulation

### Libraries
- **Chart.js** (v4.4.0): Visualization library for rendering price trend charts

### API
- **CoinGecko API**: Free cryptocurrency data API
  - Endpoint: `https://api.coingecko.com/api/v3`
  - No API key required
  - Rate limit: ~10-50 requests/minute (public tier)

## Project Structure

\`\`\`
crypto-tracker/
│
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── script.js           # JavaScript logic and API integration
└── README.md           # Project documentation
\`\`\`

## How to Run the Project

### Option 1: Local File System

1. **Download the project files**
   \`\`\`bash
   # Download or clone the repository
   # Ensure you have all three files: index.html, styles.css, script.js
   \`\`\`

2. **Open in browser**
   - Simply double-click on `index.html`
   - Or right-click and select "Open with" → Your preferred browser

### Option 2: Local Web Server (Recommended)

Using a local web server ensures proper resource loading and better performance.

#### Using Python
\`\`\`bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
\`\`\`

Then open: `http://localhost:8000`

#### Using Node.js (with http-server)
\`\`\`bash
# Install http-server globally
npm install -g http-server

# Run the server
http-server -p 8000
\`\`\`

Then open: `http://localhost:8000`

#### Using VS Code Live Server Extension
1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

### Option 3: Deploy Online

Deploy to any static hosting service:

- **GitHub Pages**: Push to a GitHub repo and enable Pages
- **Netlify**: Drag and drop the folder
- **Vercel**: Connect your repository or upload files
- **Cloudflare Pages**: Connect via Git or direct upload

## API Integration Details

### CoinGecko API

The application uses the CoinGecko API v3, which is free and doesn't require authentication for basic usage.

#### Endpoint Used
\`\`\`javascript
https://api.coingecko.com/api/v3/coins/markets
\`\`\`

#### Parameters
- `vs_currency=usd`: Price in US Dollars
- `ids`: Comma-separated list of coin IDs
- `order=market_cap_desc`: Sort by market capitalization
- `sparkline=true`: Include 7-day sparkline data
- `price_change_percentage=24h,7d`: Include percentage changes

#### Rate Limits
- Public API: 10-50 calls/minute
- The app auto-refreshes every 60 seconds to stay within limits
- Implements error handling for failed requests

#### Example Response
\`\`\`json
[
  {
    "id": "bitcoin",
    "symbol": "btc",
    "name": "Bitcoin",
    "image": "https://...",
    "current_price": 45000,
    "market_cap": 850000000000,
    "price_change_percentage_24h": 2.5,
    "sparkline_in_7d": {
      "price": [44000, 44500, 45000, ...]
    }
  }
]
\`\`\`

## Code Structure

### JavaScript Modules

#### Data Fetching
\`\`\`javascript
fetchCryptoData() // Fetches cryptocurrency market data
\`\`\`

#### Data Processing
\`\`\`javascript
formatCurrency()        // Formats numbers as USD currency
formatLargeNumber()     // Abbreviates large numbers (K, M, B, T)
formatPercentageChange() // Formats percentage with color class
\`\`\`

#### UI Rendering
\`\`\`javascript
createCryptoCard()   // Generates HTML for individual crypto cards
renderCryptoCards()  // Renders all cards to the DOM
createSparklineChart() // Creates Chart.js sparkline visualizations
\`\`\`

#### User Interactions
\`\`\`javascript
filterCryptoData()   // Handles search functionality
refreshData()        // Manual refresh trigger
init()              // Initializes the application
\`\`\`

## Customization

### Adding More Cryptocurrencies

Edit the `COINS_TO_TRACK` array in `script.js`:

\`\`\`javascript
const COINS_TO_TRACK = [
    'bitcoin', 
    'ethereum', 
    'your-coin-id'  // Add CoinGecko coin ID
];
\`\`\`

Find coin IDs at: https://api.coingecko.com/api/v3/coins/list

### Changing the Color Scheme

Modify CSS variables in `styles.css`:

\`\`\`css
:root {
    --bg-primary: #0a0b0d;      /* Main background */
    --accent-primary: #3b82f6;   /* Brand color */
    --success: #10b981;          /* Positive change */
    --danger: #ef4444;           /* Negative change */
}
\`\`\`

### Adjusting Auto-Refresh Interval

Change the interval in `script.js`:

\`\`\`javascript
// Default: 60000ms (60 seconds)
setInterval(() => {
    loadCryptoData();
}, 60000); // Change this value
\`\`\`

## Browser Support

- **Chrome/Edge**: 90+ (Recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Mobile Browsers**: iOS Safari 14+, Chrome Mobile 90+

## Performance Optimizations

- **Debounced Search**: 300ms delay to reduce unnecessary filtering
- **Chart Reuse**: Destroys and recreates charts to prevent memory leaks
- **Responsive Images**: Uses optimized image loading from CoinGecko CDN
- **Efficient DOM Updates**: Only updates changed elements
- **Lazy Chart Creation**: Charts render after DOM insertion

## Known Limitations

- **API Rate Limits**: Public CoinGecko API has rate limits; excessive requests may fail
- **No Historical Data Storage**: Data is fetched fresh on each load
- **Internet Required**: Fully dependent on API availability
- **Limited to 8 Coins**: Can be expanded but may affect performance

## Troubleshooting

### Issue: Cards Not Loading
- **Check Internet Connection**: Ensure you're online
- **Check Browser Console**: Look for API errors (F12 → Console)
- **Rate Limit**: Wait a few minutes if you've made too many requests

### Issue: Charts Not Displaying
- **Verify Chart.js CDN**: Ensure the CDN link is accessible
- **Check Canvas Support**: Update your browser to a modern version

### Issue: Search Not Working
- **Clear Browser Cache**: Refresh the page (Ctrl+F5 or Cmd+Shift+R)
- **JavaScript Enabled**: Ensure JavaScript is not blocked

## Future Enhancements

Potential features for future versions:

- [ ] Add more cryptocurrencies with pagination
- [ ] Implement price alerts/notifications
- [ ] Add currency conversion (EUR, GBP, etc.)
- [ ] Include more detailed charts with time range selection
- [ ] Add dark/light theme toggle
- [ ] Implement favorites/watchlist functionality
- [ ] Add historical price comparison
- [ ] Include market sentiment indicators

## License

This project is open source and available under the MIT License.

## Credits

- **API**: [CoinGecko](https://www.coingecko.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Icons**: Custom SVG icons

## Support

For issues, questions, or contributions, please:
1. Check existing documentation
2. Review the code comments
3. Test in different browsers
4. Check CoinGecko API status

---

**Built with ❤️ for the crypto community**
