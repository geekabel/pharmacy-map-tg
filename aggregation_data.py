import json
import unicodedata

def remove_accents(input_str):
    nfkd_form = unicodedata.normalize('NFKD', input_str)
    return ''.join([c for c in nfkd_form if not unicodedata.combining(c)])

def update_pharmacy_info(filtered_data, pharmacy_names):
    for pharmacy in filtered_data:
        filtered_name = remove_accents(pharmacy["name"].upper())
        for pharmacy_info in pharmacy_names:
            info_name = remove_accents(pharmacy_info["name"].upper())
            # print(info_name)
            if filtered_name == info_name:
                # Mettre à jour le numéro de téléphone s'il n'existe pas
                if not pharmacy["phone"]:
                    pharmacy["phone"] = pharmacy_info.get("phone", "")
                
                # Mettre à jour l'adresse si la clé "address" n'existe pas
                if "address" not in pharmacy:
                    pharmacy["address"] = pharmacy_info.get("address", "")
                
                break

if __name__ == "__main__":
    # Charger les fichiers JSON
    with open('filtered-data.json', 'r') as file:
        filtered_data = json.load(file)

    with open('/data/pharmacy_names.json', 'r') as file:
        pharmacy_names = json.load(file)

    # Appeler la fonction pour mettre à jour les informations
    update_pharmacy_info(filtered_data, pharmacy_names)
    # Supprimer la clé "dispensing" de chaque élément de la liste
    for pharmacy in filtered_data:
        if "dispensing" in pharmacy:
            del pharmacy["dispensing"]
    # Enregistrer les modifications dans filtered-data.json
    with open('filtered-data.json', 'w') as file:
        json.dump(filtered_data, file, indent=2, ensure_ascii=False)
