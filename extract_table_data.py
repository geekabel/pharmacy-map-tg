import requests
import json
from bs4 import BeautifulSoup
import hashlib

def extract_pharmacy_names(url, json_filename):
    headers = {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                      '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
    }
    response = requests.get(url, headers=headers, timeout=30)
    response.raise_for_status()
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
        if table is None:
            raise RuntimeError(
                f"Aucune table trouvée sur {url}. "
                f"La structure de la page a peut-être changé."
            )

        pharmacy_names = []
        for row in table.find_all('tr')[1:]:
            pharmacy_name = row.find_all('td')[0].text.strip()
            if pharmacy_name.startswith("PHARMACIES"):
                pharmacy_name = "PHARMACIE" + pharmacy_name[10:]
            telephone = row.find_all('td')[1].text.strip()
            address = row.find_all('td')[2].text.strip()
            pharmacy_names.append({"name": pharmacy_name,"phone": telephone,"address": address})

        with open(json_filename, 'w', encoding='utf-8') as file:
            json.dump(pharmacy_names, file, indent=2,ensure_ascii=False)

        with open('previous_hash.txt', 'w') as f:
            f.write(new_hash)

        return pharmacy_names
    else:
        print("La page n'a pas été modifiée depuis la dernière vérification.")
        return []
    
url = 'https://www.inam.tg/pharmacies-de-garde/'
json_filename = 'data/pharmacy_names.json'
pharmacy_names = extract_pharmacy_names(url, json_filename)
if pharmacy_names:
    print(json.dumps(pharmacy_names[0], indent=2, ensure_ascii=False))