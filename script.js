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

let stockChart; // To store the Chart instance

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

    fetchStockData(symbol);
});

// Function to fetch stock data from AlphaVantage
function fetchStockData(symbol) {
    // AlphaVantage TIME_SERIES_DAILY endpoint
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${apiKey}`;

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

            // Extract necessary data
            const metaData = data['Meta Data'];
            const timeSeries = data['Time Series (Daily)'];
            const dates = Object.keys(timeSeries).slice(0, 30).reverse(); // Last 30 days
            const prices = dates.map(date => parseFloat(timeSeries[date]['4. close']));

            // Update stock information
            const latestDate = Object.keys(timeSeries)[0];
            const latestData = timeSeries[latestDate];
            stockName.textContent = `${metaData['2. Symbol']} (${metaData['1. Information']})`;
            price.textContent = latestData['4. close'];
            const changeValue = parseFloat(latestData['4. close']) - parseFloat(latestData['1. open']);
            change.textContent = changeValue.toFixed(2);
            const changePercentValue = (changeValue / parseFloat(latestData['1. open'])) * 100;
            changePercent.textContent = `${changePercentValue.toFixed(2)}%`;

            // Render the chart
            renderChart(dates, prices, symbol);
        })
        .catch(error => {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data. Please try again.');
        });
}

// Function to render the chart using Chart.js
function renderChart(dates, prices, symbol) {
    // If a chart instance exists, destroy it before creating a new one
    if (stockChart) {
        stockChart.destroy();
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
                    text: `${symbol} Stock Prices - Last 30 Days`
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
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