import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import tt from '@tomtom-international/web-sdk-maps';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements AfterViewInit {
  map: any;
  userLocation: any = { latitude: 0, longitude: 0 }; // Default values

  constructor() {}

  public ngAfterViewInit(): void {
    this.loadMap();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const getTrafficButton = document.getElementById('getTrafficButton');

    if (getTrafficButton) {
      getTrafficButton.addEventListener('click', () => {
        this.getTrafficData();
      });
    }
  }

  private setCurrentPosition(): void {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position: any) => {
        this.userLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.updateMap();
      });
    }
  }

  private updateMap(): void {
    if (this.map) {
      this.map.flyTo({
        center: [this.userLocation.longitude, this.userLocation.latitude],
        zoom: 17,
      });
      const marker = new tt.Marker()
        .setLngLat([this.userLocation.longitude, this.userLocation.latitude])
        .addTo(this.map);
    }
  }

  private loadMap(): void {
    this.map = tt.map({
      key: environment.tomtom.key,
      container: 'map',
    });

    this.map.addControl(
      new tt.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showAccuracyCircle: true,
      })
    );

    this.map.on('load', () => {
      this.setCurrentPosition();
    });
  }

private getTrafficData(): void {
  const zoom = 12;
  const x = this.lon2tile(this.userLocation.longitude, zoom);
  const y = this.lat2tile(this.userLocation.latitude, zoom);

  const sourceId = 'trafficFlow';
  const layerId = 'trafficFlowLayer'; // Give a unique layer ID

  const trafficFlowURL = `https://api.tomtom.com/traffic/map/4/tile/flow/relative0-dark/${zoom}/${x}/${y}.png?tileSize=512&key=${environment.tomtom.key}`;

  // Check if the source already exists
  if (this.map.getSource(sourceId)) {
    // Check if the layer exists and remove it
    if (this.map.getLayer(layerId)) {
      this.map.removeLayer(layerId);
    }

    // Remove the source
    this.map.removeSource(sourceId);
  }

  // Add traffic flow as a new source
  this.map.addSource(sourceId, {
    type: 'raster',
    tiles: [trafficFlowURL],
    tileSize: 512,
  });

  // Add layer for the new source
  this.map.addLayer({
    id: layerId,
    type: 'raster',
    source: sourceId,
    minzoom: 6,
    maxzoom: 18,
    layout: {
      visibility: 'visible',
    },
  });
}


  private lon2tile(lon: number, zoom: number): number {
    return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
  }

  private lat2tile(lat: number, zoom: number): number {
    return Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) +
            1 / Math.cos((lat * Math.PI) / 180)
        )) /
        Math.PI) /
      2 *
      Math.pow(2, zoom)
    );
  }
}
