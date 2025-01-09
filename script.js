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

// Select all time range buttons
const timeRangeButtons = document.querySelectorAll('.time-range-btn');

let selectedTimeRange = ''; // Variable to store the selected time range
let stockChart; // To store the Chart instance

// Add event listeners to the time range buttons
timeRangeButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove 'active' class from all buttons
        timeRangeButtons.forEach(btn => btn.classList.remove('active'));
        // Add 'active' class to the clicked button
        button.classList.add('active');
        // Set the selected time range
        selectedTimeRange = button.getAttribute('data-range');
    });
});

// Event listener for the fetch button
fetchButton.addEventListener('click', () => {
    let symbol = '';

    if (symbolSelect.value) {
        symbol = symbolSelect.value;
    } else if (symbolInput.value.trim() !== '') {
        symbol = symbolInput.value.trim().toUpperCase();
    } else {
        alert('Please select a stock symbol or enter one.');
        return;
    }

    if (!selectedTimeRange) {
        alert('Please select a time range.');
        return;
    }

    fetchStockData(symbol, selectedTimeRange);
});

// Function to fetch stock data from AlphaVantage
function fetchStockData(symbol, timeRange) {
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
            alert('Invalid time range selected.');
            return;
    }

    url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=${outputSize}&apikey=${apiKey}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Handle API errors
            if (data['Error Message']) {
                alert('Invalid stock symbol. Please try again.');
                return;
            }
            if (data['Note']) {
                alert('API Call Limit Reached. Please wait and try again later.');
                return;
            }

            processDailyData(data, symbol, timeRange);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data. Please try again.');
        });
}

// Function to process daily data (7d, 30d, 90d, 1y, 3y)
function processDailyData(data, symbol, timeRange) {
    const metaData = data['Meta Data'];
    const timeSeries = data['Time Series (Daily)'];

    if (!timeSeries) {
        alert('Daily data not available for the selected symbol.');
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
            days = 252; // Approximate trading days in a year
            break;
        case '3y':
            days = 756; // Approximate trading days in three years
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
    stockName.textContent = `${metaData['2. Symbol']} (${metaData['1. Information']})`;
    price.textContent = latestData['4. close'];
    const changeValue = parseFloat(latestData['4. close']) - parseFloat(previousData['4. close']);
    change.textContent = changeValue.toFixed(2);
    const changePercentValue = (changeValue / parseFloat(previousData['4. close'])) * 100;
    changePercent.textContent = `${changePercentValue.toFixed(2)}%`;

    // Render the chart
    renderChart(dates, prices, symbol, 'Daily');
}

// Function to render the chart using Chart.js
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