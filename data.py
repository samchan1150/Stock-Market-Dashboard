import requests
import csv

API_KEY = 'XPHMTFBDIR8TS1FU'
BASE_URL = 'https://www.alphavantage.co/query'

def get_stock_symbols():
    """
    Fetches the list of stock symbols from Alpha Vantage.
    Note: Alpha Vantage provides a 'LISTING_STATUS' endpoint for exchange listings.
    """
    params = {
        'function': 'LISTING_STATUS',
        'state': 'active',  # You can also use 'inactive' or 'delisted'
        'apikey': API_KEY,
        'datatype': 'csv'
    }
    
    response = requests.get(BASE_URL, params=params)
    
    if response.status_code == 200:
        # Save the CSV data to a file
        with open('stock_symbols.csv', 'w', newline='', encoding='utf-8') as file:
            file.write(response.text)
        print("Stock symbols have been saved to 'stock_symbols.csv'.")
    else:
        print(f"Failed to fetch data. Status code: {response.status_code}")
        print("Response:", response.text)

if __name__ == "__main__":
    get_stock_symbols()