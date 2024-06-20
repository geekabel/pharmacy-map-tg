import requests
from bs4 import BeautifulSoup
from geopy.geocoders import Nominatim
import json
import time

# Initialize geocoder
geolocator = Nominatim(user_agent="pharmacy_scraper", timeout=10)

def geocode_address(address):
    try:
        location = geolocator.geocode(address)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except Exception as e:
        print(f"Geocoding error for address {address}: {e}")
        return None, None

def scrape_goafrica():
    url = "https://www.goafricaonline.com/tg/annuaire/pharmacies"
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    pharmacies = []
    for pharmacy in soup.select(".item-annuaire"):
        name = pharmacy.select_one(".denomination").text.strip()
        print(name)
        address = pharmacy.select_one(".adresse").text.strip()
        phone = pharmacy.select_one(".telephone a").text.strip() if pharmacy.select_one(".telephone a") else ""
        lat, lon = geocode_address(address)
        time.sleep(1)  # Sleep to respect API usage policies

        pharmacies.append({
            "name": name,
            "address": address,
            "phone": phone,
            "lat": lat,
            "lon": lon
        })
    return pharmacies

# def scrape_expat():
#     url = "https://www.expat.com/en/business/africa/togo/5_pharmacies/"
#     response = requests.get(url)
#     soup = BeautifulSoup(response.text, 'html.parser')
#     pharmacies = []

#     for pharmacy in soup.select(".item"):
#         name = pharmacy.select_one("h3 a").text.strip()
#         address = pharmacy.select_one(".address").text.strip()
#         phone = pharmacy.select_one(".phone").text.strip() if pharmacy.select_one(".phone") else ""
#         lat, lon = geocode_address(address)
#         time.sleep(1)  # Sleep to respect API usage policies

#         pharmacies.append({
#             "name": name,
#             "address": address,
#             "phone": phone,
#             "lat": lat,
#             "lon": lon
#         })
#     return pharmacies

# def scrape_mapcarta():
#     url = "https://mapcarta.com/N4521115196"
#     response = requests.get(url)
#     soup = BeautifulSoup(response.text, 'html.parser')
#     pharmacies = []

#     name = soup.select_one("h1").text.strip()
#     address = "Maritime Region, Togo"
#     coords = soup.select_one(".geo").text.strip().split('; ')
#     phone = ""
#     lat, lon = coords[0], coords[1]

#     pharmacies.append({
#         "name": name,
#         "address": address,
#         "phone": phone,
#         "lat": lat,
#         "lon": lon
#     })
#     return pharmacies

def main():
    all_pharmacies = scrape_goafrica()
    
    with open('pharmacies_togo.json', 'w') as f:
        json.dump(all_pharmacies, f, indent=4)

if __name__ == "__main__":
    main()
