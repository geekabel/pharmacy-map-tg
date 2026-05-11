class PharmacyMap {
  constructor() {
    this.map = this.createLeafletMap();
    this.cluster = L.markerClusterGroup();
    this.map.addLayer(this.cluster);
    this.markers = new Map();
    this.pharmacies = [];
    this.userPosition = null;
    this.userMarker = null;
    this.filterOnDutyOnly = false;
    this.searchQuery = "";
  }

  createLeafletMap() {
    const map = L.map("map").setView([6.28, 1.22], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
    }).addTo(map);
    return map;
  }

  createUserMarker(position) {
    const { latitude, longitude } = position.coords;
    const userLatLng = L.latLng(latitude, longitude);
    this.userPosition = userLatLng;
    const marker = L.marker(userLatLng, {
      icon: L.icon({ iconUrl: "assets/images/red-marker-icon.png" }),
    }).addTo(this.map);
    marker.bindPopup("Vous êtes ici").openPopup();
    return marker;
  }

  updateMarkerPosition(position) {
    const { latitude, longitude } = position.coords;
    const userLatLng = L.latLng(latitude, longitude);
    this.userPosition = userLatLng;
    if (this.userMarker) {
      this.userMarker.setLatLng(userLatLng);
      this.map.panTo(userLatLng);
    }
    this.updateNearbyPharmacies();
  }

  buildMarker(pharmacy) {
    const marker = L.marker([pharmacy.lat, pharmacy.lon], {
      icon: pharmacy.onDuty ? greenIcon : defaultIcon,
    });
    marker.bindPopup(`
      <h4>${escapeHtml(pharmacy.name)}</h4>
      <p>${escapeHtml(pharmacy.address || "")}</p>
      <p>${pharmacy.phone ? escapeHtml(pharmacy.phone) : "Non disponible"}</p>
      <p>${
        pharmacy.onDuty
          ? '<span class="badge badge-success">De garde</span>'
          : '<span class="badge badge-secondary">Pas de garde</span>'
      }</p>
      <button class="btn btn-primary btn-sm" onclick="pharmacyMap.navigateTo(${pharmacy.lat}, ${pharmacy.lon})">Naviguer</button>
    `);
    return marker;
  }

  refreshMarkers() {
    const q = normalizeName(this.searchQuery);
    this.cluster.clearLayers();
    for (const pharmacy of this.pharmacies) {
      if (this.filterOnDutyOnly && !pharmacy.onDuty) continue;
      if (q && !normalizeName(pharmacy.name).includes(q)) continue;
      let marker = this.markers.get(pharmacy);
      if (!marker) {
        marker = this.buildMarker(pharmacy);
        this.markers.set(pharmacy, marker);
      }
      this.cluster.addLayer(marker);
    }
  }

  async createPharmacyMap() {
    try {
      const response = await fetch("data/pharmacies-final.json");
      this.pharmacies = await response.json();
      this.refreshMarkers();

      if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
          (position) => {
            if (!this.userMarker) {
              this.userMarker = this.createUserMarker(position);
            } else {
              this.updateMarkerPosition(position);
            }
          },
          (error) => console.error("Error getting user location:", error),
        );
      }
    } catch (error) {
      console.error("Erreur en chargeant les données de pharmacies", error);
    }
  }

  setOnDutyFilter(enabled) {
    this.filterOnDutyOnly = enabled;
    this.refreshMarkers();
    this.updateNearbyPharmacies();
  }

  setSearchQuery(query) {
    this.searchQuery = query;
    this.refreshMarkers();
    this.updateNearbyPharmacies();
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  updateNearbyPharmacies() {
    if (!this.userPosition) return;
    const q = normalizeName(this.searchQuery);
    const pool = this.pharmacies
      .filter((p) => !this.filterOnDutyOnly || p.onDuty)
      .filter((p) => !q || normalizeName(p.name).includes(q))
      .map((p) => ({
        ...p,
        distance: this.calculateDistance(
          this.userPosition.lat,
          this.userPosition.lng,
          p.lat,
          p.lon,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5);

    const container = document.getElementById("nearbyPharmacies");
    if (!container) return;
    container.innerHTML = pool
      .map(
        (pharmacy) => `
          <div class="pharmacy-item ${pharmacy.onDuty ? "on-duty" : ""}" onclick="pharmacyMap.navigateTo(${pharmacy.lat}, ${pharmacy.lon})">
            <strong>${escapeHtml(pharmacy.name)}</strong><br>
            <small>${escapeHtml(pharmacy.address || "")}</small><br>
            Distance: ${pharmacy.distance.toFixed(2)} km<br>
            ${
              pharmacy.onDuty
                ? '<span class="badge badge-success">De garde</span>'
                : '<span class="badge badge-secondary">Pas de garde</span>'
            }
          </div>`,
      )
      .join("");
  }

  navigateTo(lat, lon) {
    if (this.userPosition) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${this.userPosition.lat},${this.userPosition.lng}&destination=${lat},${lon}`;
      window.open(url, "_blank");
    } else {
      alert(
        "Votre position n'est pas disponible. Veuillez activer la géolocalisation.",
      );
    }
  }
}

function normalizeName(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function escapeHtml(s) {
  return String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );
}

const greenIcon = L.icon({
  iconUrl: "assets/images/green-marker.png",
  iconSize: [41, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const defaultIcon = new L.Icon.Default();

const pharmacyMap = new PharmacyMap();
pharmacyMap.createPharmacyMap();

document.addEventListener("DOMContentLoaded", () => {
  const dutyToggle = document.getElementById("onDutyOnly");
  if (dutyToggle) {
    dutyToggle.addEventListener("change", (e) =>
      pharmacyMap.setOnDutyFilter(e.target.checked),
    );
  }
  const searchInput = document.getElementById("pharmacySearch");
  if (searchInput) {
    let timer;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timer);
      const value = e.target.value;
      timer = setTimeout(() => pharmacyMap.setSearchQuery(value), 150);
    });
  }
});
