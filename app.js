// Define a class for managing the pharmacy map
class PharmacyMap {
  constructor() {
    this.map = this.createLeafletMap();
    this.userMarker = null;
  }

  createLeafletMap() {
    const map = L.map('map').setView([6.28, 1.22], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);
    return map;
  }

  createUserMarker(position) {
    const { latitude, longitude } = position.coords;
    const userLatLng = L.latLng(latitude, longitude);
    const userMarker = L.marker(userLatLng, {
      icon: L.icon({ iconUrl: 'assets/images/red-marker-icon.png' }),
    }).addTo(this.map);
    userMarker.bindPopup("Vous êtes ici").openPopup();
    return userMarker;
  }

  updateMarkerPosition(position) {
    const { latitude, longitude } = position.coords;
    const userLatLng = L.latLng(latitude, longitude);
    this.userMarker.setLatLng(userLatLng);
    this.map.panTo(userLatLng);
  }

  addPharmacyMarker(pharmacy) {
    const marker = L.marker([pharmacy.lat, pharmacy.lon]).addTo(this.map);
    if (pharmacy.onDuty) {
      marker.setIcon(greenIcon);
    }
    const popup = L.popup().setContent(`
      <h4>${pharmacy.name}</h4>
      <p>${pharmacy.address}</p>
      <p>${pharmacy.phone ? pharmacy.phone : 'Non disponible'}</p>
      <p>${pharmacy.onDuty ? 'De garde' : 'Pas de garde'}</p>
    `);
    marker.bindPopup(popup);
  }

  async fetchAndProcessData(url) {
    const response = await fetch(url);
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }

  async createPharmacyMap() {
    try {
      const response = await fetch('filtered-data.json');
      const data = await response.json();

      data.forEach(async (pharmacy) => {
        const pharmacyNames = await this.fetchAndProcessData('pharmacy_names.json');
        const foundPharmacy = pharmacyNames.find(({ name }) => this.compareStrings(name, pharmacy.name));
        pharmacy.onDuty = !!foundPharmacy;
        this.addPharmacyMarker(pharmacy);
      });

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
          if (!this.userMarker) {
            this.userMarker = this.createUserMarker(position);
          } else {
            this.updateMarkerPosition(position);
          }
        }, (error) => {
          console.error('Error getting user location:', error);
        });
      } else {
        console.error('Geolocation is not supported by your browser');
      }
    } catch (error) {
      console.error('Erreur en chargeant les données de pharmacies', error);
    }
  }

  compareStrings(str1, str2) {
    const normalize = (str) =>
      str ? str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : str;
    return normalize(str1) === normalize(str2);
  }
}

// Custom icon for green marker
const greenIcon = L.icon({
  iconUrl: 'assets/images/green-marker.png',
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create an instance of the PharmacyMap class and initialize the pharmacy map
const pharmacyMap = new PharmacyMap();
pharmacyMap.createPharmacyMap();
