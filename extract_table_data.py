import requests
import json
from bs4 import BeautifulSoup
import hashlib

def extract_pharmacy_names(url, json_filename):
    response = requests.get(url)
    new_content = response.content
    new_hash = hashlib.sha256(new_content).hexdigest()

    try:
        with open('previous_hash.txt', 'r') as f:
            previous_hash = f.read()
    except FileNotFoundError:
        previous_hash = None

    if previous_hash != new_hash:
        soup = BeautifulSoup(response.content, 'html.parser')
        table = soup.find('table')

        pharmacy_names = []
        for row in table.find_all('tr')[1:]:
            pharmacy_name = row.find_all('td')[0].text.strip()
            pharmacy_names.append({"name": pharmacy_name})

        with open(json_filename, 'w') as file:
            json.dump(pharmacy_names, file, indent=2)

        with open('previous_hash.txt', 'w') as f:
            f.write(new_hash)

        return pharmacy_names
    else:
        print("La page n'a pas été modifiée depuis la dernière vérification.")
        # with open(json_filename, 'r') as file:
        #     pharmacy_names = json.load(file)
        # return pharmacy_names

url = 'https://www.inam.tg/pharmacies-de-garde/'
json_filename = 'pharmacy_names.json'
pharmacy_names = extract_pharmacy_names(url, json_filename)
print(pharmacy_names)
