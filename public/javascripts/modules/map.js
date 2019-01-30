import axios from 'axios';
import { $ } from './bling';

const mapOptions = {
  center: { lat: 43.2, lng: -79.8 },
  zoom: 8
};

function getMarkerInfoHTML(marker) {
  return (
  `<div class="popup">
    <a href="/stores/${marker.place.slug}">
      <img src="/uploads/${marker.place.photo || 'store.png'}" alt="${marker.place.name}"/>
      <p>${marker.place.name} - ${marker.place.location.address}</p>
    </a>
  </div>`);
};

function putPlacesInMap(map, places) {
  if (!places.length) {
    alert('No places found!');
    return ;
  }
  const bounds = new google.maps.LatLngBounds();
  const infoWindow = new google.maps.InfoWindow();
  const markers = places.map(place => makeMarker(map, place, bounds, infoWindow));
  map.setCenter(bounds.getCenter());
  map.fitBounds(bounds);
}

function makeMarker(map, place, bounds, infoWindow) {
  const [ placeLng, placeLat ] = place.location.coordinates;
  const position = { lat: placeLat, lng: placeLng };
  bounds.extend(position);
  const marker = new google.maps.Marker({ map, position });
  marker.addListener('click', function() {
    const html = getMarkerInfoHTML(this);
    infoWindow.setContent(html);
    infoWindow.open(map, this);
  });
  marker.place = place;
  return marker;
}

function loadPLaces(map, lat = 43.2, lng = -79.8) {
  axios
    .get(`/api/stores/near?lat=${lat}&lng=${lng}`)
    .then(res => putPlacesInMap(map, res.data));
}

function makeMap(mapDiv) {
  if (!mapDiv) return;
  const map = new google.maps.Map(mapDiv, mapOptions);
  loadPLaces(map);
  const input = $('[name="geolocate"]');
  const autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    loadPLaces(map, place.geometry.location.lat(), place.geometry.location.lng());
  });
}

export default makeMap;