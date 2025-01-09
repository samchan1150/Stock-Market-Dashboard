// Replace with your actual AlphaVantage API key
const apiKey = 'XPHMTFBDIR8TS1FU';

// Select DOM elements
const fetchButton = document.getElementById('fetchButton');
const symbolSelect = document.getElementById('symbolSelect');
const symbolInput = document.getElementById('symbolInput');
const stockName = document.getElementById('stockName');
const price = document.getElementById('price');
const change = document.getElementById('change');
const changePercent = document.getElementById('changePercent');
const stockChartCtx = document.getElementById('stockChart').getContext('2d');
const errorMessage = document.getElementById('errorMessage');
const loadingIndicator = document.getElementById('loading');
const dataLoadingIndicator = document.getElementById('dataLoading');

// Select all time range buttons and the container
const timeRangeButtons = document.querySelectorAll('.time-range-btn');
const timeRangeContainer = document.querySelector('.time-range');

let selectedTimeRange = ''; // Variable to store the selected time range
let currentSymbol = ''; // Variable to store the current stock symbol
let stockChart; // To store the Chart instance

// Throttling parameters
let lastApiCallTime = 0;
const apiCooldown = 60000; // 1 minute in milliseconds

/**
 * Checks if an API call can be made based on cooldown
 * @returns {boolean} - True if API call is allowed, else false
 */
function canMakeApiCall() {
    const now = Date.now();
    if (now - lastApiCallTime > apiCooldown) {
        lastApiCallTime = now;
        return true;
    }
    return false;
}

/**
 * Displays an error message in the UI
 * @param {string} message - The error message to display
 */
function displayError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
}

/**
 * Clears any existing error messages from the UI
 */
function clearError() {
    errorMessage.textContent = '';
    errorMessage.classList.add('hidden');
}

/**
 * Fetch and populate stock symbols from CSV
 */
function populateStockSymbols() {
    loadingIndicator.classList.remove('hidden'); // Show loading
    fetch('stock_symbols.csv') // Ensure the CSV file is in the same directory or provide the correct path
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.text();
        })
        .then(csvText => {
            if (!csvText.trim()) {
                throw new Error('CSV file is empty.');
            }
            const parsedData = Papa.parse(csvText, {
                header: true,
                skipEmptyLines: true
            });
            if (!parsedData.data.length) {
                throw new Error('No data found in CSV.');
            }
            const symbols = parsedData.data;
            let symbolList = []; // To store symbols for autocomplete
            symbols.forEach(item => {
                if (item.symbol && item.name) {
                    const option = document.createElement('option');
                    option.value = item.symbol;
                    option.textContent = `${item.symbol} - ${item.name}`;
                    symbolSelect.appendChild(option);
                    symbolList.push(item.symbol); // Add to autocomplete list
                }
            });
            // Initialize Awesomplete for autocomplete functionality
            new Awesomplete(symbolInput, {
                list: symbolList,
                minChars: 1,
                maxItems: 10,
                autoFirst: true
            });

            loadingIndicator.classList.add('hidden'); // Hide loading
        })
        .catch(error => {
            console.error('Error fetching stock symbols:', error);
            displayError('Failed to load stock symbols.');
            loadingIndicator.textContent = 'Failed to load stock symbols.';
        });
}

// Call the function on page load
document.addEventListener('DOMContentLoaded', populateStockSymbols);

// Add event listeners to the time range buttons
timeRangeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove 'active' class from all buttons
        timeRangeButtons.forEach(btn => btn.classList.remove('active'));
        // Add 'active' class to the clicked button
        button.classList.add('active');
        // Set the selected time range
        selectedTimeRange = button.getAttribute('data-range');
        // Fetch and update the chart with the new time range
        if (currentSymbol) {
            fetchStockData(currentSymbol, selectedTimeRange);
        }
    });
});

// Event listener for the fetch button
fetchButton.addEventListener('click', () => {
    clearError(); // Clear previous errors

    let symbol = '';

    if (symbolSelect.value) {
        symbol = symbolSelect.value;
    } else if (symbolInput.value.trim() !== '') {
        symbol = symbolInput.value.trim().toUpperCase();
    } else {
        displayError('Please select a stock symbol or enter one.');
        return;
    }

    if (!canMakeApiCall()) {
        displayError('API rate limit exceeded. Please wait a minute before trying again.');
        return;
    }

    selectedTimeRange = '30d'; // Default time range on initial fetch
    // Activate the default time range button (30 Days)
    timeRangeButtons.forEach(btn => {
        if (btn.getAttribute('data-range') === selectedTimeRange) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    currentSymbol = symbol; // Update the current symbol
    fetchStockData(symbol, selectedTimeRange);
});

/**
 * Fetches stock data from AlphaVantage API with caching
 * @param {string} symbol - The stock symbol to fetch data for
 * @param {string} timeRange - The selected time range for data
 */
function fetchStockData(symbol, timeRange) {
    let cacheKey = `${symbol}_${timeRange}`;
    let cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
        console.log('Using cached data for:', cacheKey);
        processDailyData(JSON.parse(cachedData), symbol, timeRange);
        return;
    }

    let url = '';
    let outputSize = 'compact'; // Default output size

    switch (timeRange) {
        case '7d':
            outputSize = 'compact';
            break;
        case '30d':
            outputSize = 'compact';
            break;
        case '90d':
            outputSize = 'full';
            break;
        case '1y':
            outputSize = 'full';
            break;
        case '3y':
            outputSize = 'full';
            break;
        default:
            displayError('Invalid time range selected.');
            return;
    }

    url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`;

    dataLoadingIndicator.classList.remove('hidden'); // Show data loading indicator

    fetch(url)
        .then(response => response.json())
        .then(data => {
            dataLoadingIndicator.classList.add('hidden'); // Hide data loading indicator

            console.log('API Response:', data); // Log the complete response

            // Handle API errors
            if (data['Error Message']) {
                displayError('Invalid stock symbol. Please try again.');
                return;
            }
            if (data['Note']) {
                displayError('API Call Limit Reached. Please wait and try again later.');
                return;
            }

            // Check if 'Time Series (Daily)' exists
            if (!data['Time Series (Daily)']) {
                displayError('Daily data not available for the selected symbol.');
                return;
            }

            // Cache the data
            localStorage.setItem(cacheKey, JSON.stringify(data));

            processDailyData(data, symbol, timeRange);
        })
        .catch(error => {
            dataLoadingIndicator.classList.add('hidden'); // Hide data loading indicator
            console.error('Error fetching data:', error);
            displayError('An error occurred while fetching data. Please try again.');
        });
}

/**
 * Processes the fetched daily stock data
 * @param {object} data - The API response data
 * @param {string} symbol - The stock symbol
 * @param {string} timeRange - The selected time range for data
 */
function processDailyData(data, symbol, timeRange) {
    const metaData = data['Meta Data'];
    const timeSeries = data['Time Series (Daily)'];

    if (!timeSeries) {
        displayError('Daily data not available for the selected symbol.');
        return;
    }

    let dates = Object.keys(timeSeries).sort();
    let prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

    // Determine the number of days to display based on the time range
    let days;
    switch (timeRange) {
        case '7d':
            days = 7;
            break;
        case '30d':
            days = 30;
            break;
        case '90d':
            days = 90;
            break;
        case '1y':
            days = 365;
            break;
        case '3y':
            days = 1095;
            break;
        default:
            days = 30;
    }

    // Ensure that we have enough data points
    if (dates.length < days) {
        days = dates.length;
    }

    dates = dates.slice(-days);
    prices = prices.slice(-days);

    // Update stock information
    const latestDate = dates[dates.length - 1];
    const latestData = timeSeries[latestDate];
    const previousDate = dates.length >= 2 ? dates[dates.length - 2] : latestDate;
    const previousData = timeSeries[previousDate];

    // Retrieve the company name from the dropdown options
    const selectedOption = symbolSelect.querySelector(`option[value="${symbol}"]`);
    const companyName = selectedOption ? selectedOption.textContent.split(' - ')[1] : 'Unknown Company';

    stockName.textContent = `${symbol} - ${companyName}`;

    price.textContent = parseFloat(latestData['4. close']).toFixed(2);
    const changeValue = parseFloat(latestData['4. close']) - parseFloat(previousData['4. close']);
    change.textContent = changeValue.toFixed(2);
    const changePercentValue = (changeValue / parseFloat(previousData['4. close'])) * 100;
    changePercent.textContent = `${changePercentValue.toFixed(2)}%`;

    // Render the chart
    renderChart(dates, prices, symbol, 'Daily');

    // Show the time range buttons after the chart is rendered
    timeRangeContainer.classList.remove('hidden');
}

/**
 * Renders the stock price chart using Chart.js
 * @param {array} dates - Array of dates
 * @param {array} prices - Array of closing prices
 * @param {string} symbol - The stock symbol
 * @param {string} dataType - Type of data (e.g., 'Daily')
 */
function renderChart(dates, prices, symbol, dataType) {
    // If a chart instance exists, destroy it before creating a new one
    if (stockChart) {
        stockChart.destroy();
    }

    let chartTitle = '';
    if (dataType === 'Intraday') {
        chartTitle = `${symbol} Stock Prices - Last 24 Hours`;
    } else {
        chartTitle = `${symbol} Stock Prices - Last ${dates.length} Days`;
    }

    stockChart = new Chart(stockChartCtx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: `${symbol} Closing Prices`,
                data: prices,
                borderColor: '#3498db',
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: '#3498db',
                fill: true,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: chartTitle
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: dataType === 'Intraday' ? 'Time' : 'Date'
                    },
                    ticks: {
                        maxRotation: 90,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Price (USD)'
                    }
                }
            }
        }
    });
}