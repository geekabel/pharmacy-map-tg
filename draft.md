## All idea draft here

```js
// Load the pharmacies data from filtered-data.json
fetch('filtered-data.json')
  .then(response => response.json())
  .then(data => {
    // Create a Leaflet map object centered on Lome, Togo
    const map = L.map('map').setView([6.1319, 1.2228], 13);

    // Add a tile layer to display the map of Lome, Togo
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Loop through the pharmacies data and add markers to the map
    data.forEach(pharmacy => {
      // Create a marker for the pharmacy
      const marker = L.marker([pharmacy.lat, pharmacy.lon]).addTo(map);

      // Create a popup for the marker that displays the pharmacy details <p>${pharmacy.address}</p>
      const popup = L.popup().setContent(`
        <h3>${pharmacy.name}</h3>
        <p>${pharmacy.phone}</p>
        <p>${pharmacy.onDuty ? 'On duty' : 'Off duty'}</p>
      `);
      marker.bindPopup(popup);
    });
  });

function convertExcelToJson(workbook) {
  const result = {};
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    result[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  });
  return result;
}

async function fetchAndProcessData(url) {
  const response = await fetch(url);
  const data = await response.arrayBuffer();
  const workbook = XLSX.read(data);
  const excelData = convertExcelToJson(workbook);
  
  console.log(excelData);
  console.log("The length of our collection array is " + excelData.length);
}

(async () => {
  const url = "table_data.csv";
  await fetchAndProcessData(url);
})();

if (updatedPharmacy && updatedPharmacy.onDuty) {
  // Update the marker color to flash green
  marker.on('add', function () {
    const icon = this._icon;
    let flashCount = 0;
    const flashInterval = setInterval(() => {
      if (flashCount % 2 === 0) {
        icon.style.backgroundColor = 'green';
      } else {
        icon.style.backgroundColor = '';
      }
      flashCount++;
      if (flashCount === 6) {
        clearInterval(flashInterval);
        icon.style.backgroundColor = '';
      }
    }, 500);
  });
}
```

[out:json];
area["ISO3166-1"="TG"][admin_level=2];
(node["amenity"="pharmacy"](area);
 way["amenity"="pharmacy"](area);
 rel["amenity"="pharmacy"](area););
out center;