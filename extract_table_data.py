import requests
import json
from bs4 import BeautifulSoup

def extract_pharmacy_names(url, json_filename):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    table = soup.find('table')

    pharmacy_names = []
    for row in table.find_all('tr')[1:]:
        pharmacy_name = row.find_all('td')[0].text.strip()
        # tel = row.find_all('td')[1].text.strip()
        # print({"tel": tel})
        pharmacy_names.append({"name": pharmacy_name})

    with open(json_filename, 'w') as file:
        json.dump(pharmacy_names, file, indent=2)

    return pharmacy_names

url = 'https://www.inam.tg/pharmacies-de-garde/'
json_filename = 'pharmacy_names.json'
pharmacy_names = extract_pharmacy_names(url, json_filename)
print(pharmacy_names)


# import requests
# from bs4 import BeautifulSoup
# import csv
# import filecmp
# import os
# from datetime import date

# def extract_table_data(url, csv_filename,old_csv_filename):
#     response = requests.get(url)
#     soup = BeautifulSoup(response.content, 'html.parser')
#     table = soup.find('table')

#     rows = []
#     for row in table.find_all('tr'):
#         cells = []
#         for cell in row.find_all(['th', 'td']):
#             cells.append(cell.text.strip())
#         rows.append(cells)

#     with open(csv_filename, mode='w', newline='') as file:
#         writer = csv.writer(file)
#         writer.writerows(rows)

#     if not filecmp.cmp(csv_filename, old_csv_filename):
#         # Files are different, do something
#         today = date.today().strftime("%Y%m%d")
#         old_csv_filename_backup = f"{os.path.splitext(old_csv_filename)[0]}.old_{today}.csv"
#         os.rename(old_csv_filename, old_csv_filename_backup)
#         os.rename(new_csv_filename, old_csv_filename)
#         print(f"The files are different. Old file saved as {old_csv_filename_backup} and new file updated.")
#         print("file are different")
#     else:
#         # Files are the same, don't do anything
#         os.remove(new_csv_filename)
#         print("The files are the same. No update needed.")
#     return rows

# url = 'https://www.inam.tg/pharmacies-de-garde/'
# csv_filename_old = 'table_data.csv'
# new_csv_filename = 'new_csv_table_data.csv'
# table_data = extract_table_data(url,new_csv_filename,csv_filename_old)
# print(table_data)
