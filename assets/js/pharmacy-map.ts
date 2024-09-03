interface Pharmacy {
    name: string;
    address: string;
    lat: number;
    lon: number;
    phone?: string;
    onDuty: boolean;
}

interface Position {
    coords: {
        latitude: number;
        longitude: number;
    };
}

class PharmacyMap {
    private map: L.Map;
    private userMarker: L.Marker | null = null;
    private pharmacies: Pharmacy[] = [];
    private userPosition: L.LatLng | null = null;

    constructor() {
        this.map = this.createLeafletMap();
    }

    private createLeafletMap(): L.Map {
        const map = L.map('map').setView([6.28, 1.22], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
        }).addTo(map);
        return map;
    }

    private createUserMarker(position: Position): L.Marker {
        const { latitude, longitude } = position.coords;
        const userLatLng = L.latLng(latitude, longitude);
        this.userPosition = userLatLng;
        const userMarker = L.marker(userLatLng, {
            icon: L.icon({ iconUrl: 'assets/images/red-marker-icon.png' }),
        }).addTo(this.map);
        userMarker.bindPopup("Vous êtes ici").openPopup();
        return userMarker;
    }

    private updateMarkerPosition(position: Position): void {
        const { latitude, longitude } = position.coords;
        const userLatLng = L.latLng(latitude, longitude);
        this.userPosition = userLatLng;
        if (this.userMarker) {
            this.userMarker.setLatLng(userLatLng);
            this.map.panTo(userLatLng);
        }
        this.updateNearbyPharmacies();
    }

    private addPharmacyMarker(pharmacy: Pharmacy): void {
        const marker = L.marker([pharmacy.lat, pharmacy.lon]).addTo(this.map);
        if (pharmacy.onDuty) {
            marker.setIcon(greenIcon);
        }
        const popup = L.popup().setContent(`
            <h4>${pharmacy.name}</h4>
            <p>${pharmacy.address}</p>
            <p>${pharmacy.phone ? pharmacy.phone : 'Non disponible'}</p>
            <p>${pharmacy.onDuty ? 'De garde' : 'Pas de garde'}</p>
            <button onclick="pharmacyMap.navigateTo(${pharmacy.lat}, ${pharmacy.lon})">Naviguer</button>
        `);
        marker.bindPopup(popup);
    }

    private async fetchAndProcessData(url: string): Promise<any[]> {
        const response = await fetch(url);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    }

    public async createPharmacyMap(): Promise<void> {
        try {
            const response = await fetch('data/filtered-data.json');
            const data: Pharmacy[] = await response.json();
            const url = 'data/pharmacy_names.json'
            const pharmacyNames = await this.fetchAndProcessData(url);
            
            this.pharmacies = data.map(pharmacy => ({
                ...pharmacy,
                onDuty: !!pharmacyNames.find(({ name }) => this.compareStrings(name, pharmacy.name))
            }));

            this.pharmacies.forEach(pharmacy => this.addPharmacyMarker(pharmacy));

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

    private compareStrings(str1: string, str2: string): boolean {
        const normalize = (str: string): string =>
            str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalize(str1) === normalize(str2);
    }

    private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the Earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    private updateNearbyPharmacies(): void {
        if (!this.userPosition) return;

        const nearbyPharmacies = this.pharmacies
            .map(pharmacy => ({
                ...pharmacy,
                distance: this.calculateDistance(this.userPosition!.lat, this.userPosition!.lng, pharmacy.lat, pharmacy.lon)
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 5);

        const container = document.getElementById('nearbyPharmacies');
        if (container) {
            container.innerHTML = nearbyPharmacies.map(pharmacy => `
                <div class="pharmacy-item" onclick="pharmacyMap.navigateTo(${pharmacy.lat}, ${pharmacy.lon})">
                    <strong>${pharmacy.name}</strong><br>
                    Distance: ${pharmacy.distance.toFixed(2)} km<br>
                    ${pharmacy.onDuty ? '<span class="badge badge-success">De garde</span>' : ''}
                </div>
            `).join('');
        }
    }

    public navigateTo(lat: number, lon: number): void {
        if (this.userPosition) {
            const url = `https://www.google.com/maps/dir/?api=1&origin=${this.userPosition.lat},${this.userPosition.lng}&destination=${lat},${lon}`;
            window.open(url, '_blank');
        } else {
            alert("Votre position n'est pas disponible. Veuillez activer la géolocalisation.");
        }
    }
}

const greenIcon = L.icon({
    iconUrl: 'assets/images/green-marker.png',
    iconSize: [41, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const pharmacyMap = new PharmacyMap();
pharmacyMap.createPharmacyMap();