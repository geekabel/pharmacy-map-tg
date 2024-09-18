import requests
import json
from bs4 import BeautifulSoup
import re
import os

def extract_pharmacy_info(url, json_filename):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    
    # Extract the date range
    date_element = soup.find('p', style=lambda value: value and 'color: #c42d2d' in value)
    if date_element:
        date_text = date_element.get_text(strip=True)
        date_range = re.search(r'(\d+\s+au\s+\d+\s+\w+\s+\d{4})', date_text)
        if date_range:
            date_range = date_range.group(1)
        else:
            date_range = "Date format not recognized"
    else:
        date_range = "Date element not found"
    
    table = soup.find('table', {'id': 'tablepress-162'})

    new_pharmacy_info = {
        "date_range": date_range,
        "pharmacies": []
    }
    
    if table:
        for row in table.find('tbody').find_all('tr'):
            cols = row.find_all('td')
            if len(cols) >= 3:
                new_pharmacy_info["pharmacies"].append({
                    "name": cols[0].text.strip(),
                    "phone": cols[1].text.strip(),
                    "address": cols[2].text.strip()
                })

    # Check if local file exists and compare pharmacy names
    if os.path.exists(json_filename):
        with open(json_filename, 'r', encoding='utf-8') as file:
            local_pharmacy_info = json.load(file)
        
        local_names = set(pharmacy['name'] for pharmacy in local_pharmacy_info['pharmacies'])
        new_names = set(pharmacy['name'] for pharmacy in new_pharmacy_info['pharmacies'])
        
        if local_names == new_names:
            print("No changes in pharmacy names. Using local data.")
            return local_pharmacy_info
    
    # If we reach here, it means we need to update
    with open(json_filename, 'w', encoding='utf-8') as file:
        json.dump(new_pharmacy_info, file, indent=2, ensure_ascii=False)
    
    print("Pharmacy data updated.")
    return new_pharmacy_info

url = 'https://www.inam.tg/pharmacies-de-garde/'
json_filename = 'pharmacy_info.json'
pharmacy_info = extract_pharmacy_info(url, json_filename)

print(f"Date range: {pharmacy_info['date_range']}")
print(f"Number of pharmacies: {len(pharmacy_info['pharmacies'])}")
if pharmacy_info['pharmacies']:
    print("First pharmacy:")
    print(json.dumps(pharmacy_info['pharmacies'][0], indent=2, ensure_ascii=False))
else:
    print("No pharmacies found.")