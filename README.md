# Stock Market Dashboard

## Introduction
This Stock Market Dashboard is a web-based tool for exploring and visualizing real-time stock market data. It integrates with the Alpha Vantage API to fetch the latest stock symbols and price information, displaying key metrics and historical trends in a clean, interactive interface.

## Features
- Real-time fetching of stock data from Alpha Vantage
- Auto-populated dropdown for quick symbol selection
- Dynamic rendering of stock price charts with configurable time ranges
- Interactive controls for easy navigation (switch between 7 days, 30 days, 90 days, 1 year, 3 years)
- Visual indicators for price changes (current price, daily change, and percentage)
- Error handling and loading indicators for seamless user experience

## Data Sources
- Alpha Vantage API for up-to-date stock listings and daily pricing
- Local caching to reduce redundant API calls
- CSV file (fetched from API) for symbol auto-completion

## Usage
1. Clone or download the project files.  
2. Open your preferred web server or use the built-in server in VS Code.  
3. Ensure API key is set in both `data.py` (for CSV fetching) and `script.js` (for price/interval requests).  
4. Run `python data.py` to fetch and store the latest symbols in `stock_symbols.csv`.  
5. Open `index.html` in your browser to view and interact with the dashboard.  
6. Select a symbol (or enter one in the text field) and click “Fetch Data” to see the latest pricing and chart.  
7. Switch between time ranges to explore different historical views.

## Technical Details
- Built with HTML, CSS, and JavaScript, using Chart.js for chart rendering
- Python script for fetching and storing CSV data
- Fetch API calls for dynamic updates and error handling
- LocalStorage caching to optimize data retrieval
- Responsive design for various screen sizes
