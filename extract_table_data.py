import requests
import json
from bs4 import BeautifulSoup
import hashlib
import sys

BROWSER_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 '
                  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,'
              'image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
}


def fetch(url):
    session = requests.Session()
    session.headers.update(BROWSER_HEADERS)
    response = session.get(url, timeout=30)
    print(f"[fetch] {url} -> HTTP {response.status_code}, "
          f"{len(response.content)} bytes, "
          f"content-type={response.headers.get('content-type')}")
    response.raise_for_status()
    return response


def extract_pharmacy_names(url, json_filename):
    response = fetch(url)
    new_content = response.content
    new_hash = hashlib.sha256(new_content).hexdigest()

    try:
        with open('previous_hash.txt', 'r') as f:
            previous_hash = f.read()
    except FileNotFoundError:
        previous_hash = None

    if previous_hash == new_hash:
        print("La page n'a pas été modifiée depuis la dernière vérification.")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    table = soup.find('table')
    if table is None:
        all_tables = soup.find_all('table')
        print(f"[diag] Aucune <table> trouvée. find_all('table')={len(all_tables)}")
        print(f"[diag] <title>: {soup.title.string if soup.title else 'N/A'}")
        body_text = soup.get_text(' ', strip=True)[:300]
        print(f"[diag] Début du body: {body_text!r}")
        raise RuntimeError(
            f"Aucune table trouvée sur {url}. "
            "La structure de la page a peut-être changé."
        )

    pharmacy_names = []
    for row in table.find_all('tr')[1:]:
        cells = row.find_all('td')
        if len(cells) < 3:
            continue
        pharmacy_name = cells[0].text.strip()
        if pharmacy_name.startswith("PHARMACIES"):
            pharmacy_name = "PHARMACIE" + pharmacy_name[10:]
        telephone = cells[1].text.strip()
        address = cells[2].text.strip()
        pharmacy_names.append({
            "name": pharmacy_name,
            "phone": telephone,
            "address": address,
        })

    with open(json_filename, 'w', encoding='utf-8') as file:
        json.dump(pharmacy_names, file, indent=2, ensure_ascii=False)

    with open('previous_hash.txt', 'w') as f:
        f.write(new_hash)

    return pharmacy_names


if __name__ == "__main__":
    url = 'https://www.inam.tg/pharmacies-de-garde/'
    json_filename = 'data/pharmacy_names.json'
    try:
        pharmacy_names = extract_pharmacy_names(url, json_filename)
    except requests.exceptions.HTTPError as e:
        print(f"[error] HTTP error: {e}", file=sys.stderr)
        raise
    except requests.exceptions.SSLError as e:
        print(f"[error] SSL error: {e}", file=sys.stderr)
        raise
    if pharmacy_names:
        print(f"[ok] {len(pharmacy_names)} pharmacies extraites")
        print(json.dumps(pharmacy_names[0], indent=2, ensure_ascii=False))
