'use strict';

// Helper function to compare strings with case-insensitivity and handling accents
function compareStrings(str1, str2) {
  const normalize = (str) =>
    str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''): str;
  return normalize(str1) === normalize(str2);
}

// Helper function to create a Leaflet map
function createLeafletMap() {
  // Create a Leaflet map object centered on Lome, Togo
  const map = L.map('map').setView([6.28, 1.22], 12);

  // Add a tile layer to display the map of Lome, Togo
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
  }).addTo(map);

  return map;
}

// Helper function to create a user marker
function createUserMarker(map, position) {
  const { latitude, longitude } = position.coords;
  const userLatLng = L.latLng(latitude, longitude);
  const userMarker = L.marker(userLatLng, {
    icon: L.icon({ iconUrl: 'assets/images/red-marker-icon.png' }),
  }).addTo(map);

  userMarker.bindPopup("It's me").openPopup();

  return userMarker;
}

// Helper function to update the user's marker position
function updateMarkerPosition(userMarker, position) {
  const { latitude, longitude } = position.coords;
  const userLatLng = L.latLng(latitude, longitude);

  userMarker.setLatLng(userLatLng);

  // Center the map on the user's position
  map.panBy(userLatLng);
}

// Helper function to add a pharmacy marker to the map
function addPharmacyMarker(map, pharmacy) {
  // Create a marker for the pharmacy
  const marker = L.marker([pharmacy.lat, pharmacy.lon]).addTo(map);

  // Set marker color and animation based on onDuty property
  if (pharmacy.onDuty) {
    marker.setIcon(greenIcon);
  }

  // Create a popup for the marker that displays the pharmacy details
  const popup = L.popup().setContent(`
    <h4>${pharmacy.name}</h4>
    <p>${pharmacy.phone}</p>
    <p>${pharmacy.onDuty ? 'De garde' : 'Pas de garde'}</p>
  `);
  marker.bindPopup(popup);
}

// Function to create the pharmacy map
function createPharmacyMap() {
  // Load the pharmacies data from filtered-data.json
  fetch('filtered-data.json')
    .then((response) => response.json())
    .then((data) => {
      // Create a Leaflet map
      const map = createLeafletMap();

      // Function to update the user's location
      let userMarker; // Variable to hold the user's marker

      // Update the user's marker position when geolocation changes
      function updateMarkerPositionWrapper(position) {
        if (!userMarker) {
          // Create the user's marker if it doesn't exist
          userMarker = createUserMarker(map, position);
        } else {
          // Move the user's marker to the updated position
          updateMarkerPosition(userMarker, position);
        }
      }

      // Get the current position of the user
      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(updateMarkerPositionWrapper, (error) => {
          console.error('Error getting user location:', error);
        });
      } else {
        console.error('Geolocation is not supported by your browser');
      }

      // Load the content of pharmacy_names.json for comparison
      fetchAndProcessData('pharmacy_names.json').then((pharmacyNames) => {
        // Loop through the pharmacies data and add markers to the map
        data.forEach((pharmacy) => {
          // Check if the name of the pharmacy exists in the pharmacyNames array
          const foundPharmacy = pharmacyNames.find(({ name }) => compareStrings(name, pharmacy.name));
          // Update onDuty property based on the comparison result
          if (foundPharmacy) {
            pharmacy.onDuty = true;
          }

          // Add a pharmacy marker to the map
          addPharmacyMarker(map, pharmacy);
        });
      });
    })
    .catch((error) => {
      console.error('Erreur en chargeant les données de pharmacies', error);
    });
}

// Helper function to load the content of the specified JSON file and return it as an array
async function fetchAndProcessData(url) {
  const response = await fetch(url);
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

// Custom icon for green marker
const greenIcon = L.icon({
  iconUrl: 'assets/images/green-marker.png',
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Call the function to create the pharmacy map
createPharmacyMap();
