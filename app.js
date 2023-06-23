'use strict';

function createPharmacyMap() {
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

      // Get the current position of the user
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const userMarker = L.marker([latitude, longitude], { icon: L.icon({ iconUrl: 'assets/images/red-marker-icon.png' }) }).addTo(map);
        userMarker.bindPopup("It's me").openPopup();
      });

      // Load the content of pharmacy_names.json for comparison
      fetchAndProcessData('pharmacy_names.json')
        .then(pharmacyNames => {
          // Loop through the pharmacies data and add markers to the map
          data.forEach(pharmacy => {
            // Check if the name of the pharmacy exists in the pharmacyNames array
            const foundPharmacy = pharmacyNames.find(({ name }) =>
              compareStrings(name, pharmacy.name)
            );
            // Update onDuty property based on the comparison result
            if (foundPharmacy) {
              pharmacy.onDuty = true;
            }

            // Create a marker for the pharmacy
            const marker = L.marker([pharmacy.lat, pharmacy.lon]).addTo(map);

            // Set marker color and animation based on onDuty property
            if (pharmacy.onDuty) {
              marker.setIcon(greenIcon);
            }

            // Create a popup for the marker that displays the pharmacy details
            const popup = L.popup().setContent(`
              <h3>${pharmacy.name}</h3>
              <p>${pharmacy.phone}</p>
              <p>${pharmacy.onDuty ? 'De garde' : 'Pas de garde'}</p>
            `);
            marker.bindPopup(popup);
          });
        });
    });

  // Helper function to compare strings with case-insensitivity and handling accents
  function compareStrings(str1, str2) {
    const normalize = str => str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : str;
    return normalize(str1) === normalize(str2);
  }

  // Load the content of the specified JSON file and return it as an array
  async function fetchAndProcessData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return Array.from(data) ? data : [];
  }

  // Custom icon for green marker
  const greenIcon = L.icon({
    iconUrl: 'assets/images/green-marker.png',
    iconSize: [41, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

// Call the function to create the pharmacy map
createPharmacyMap();
