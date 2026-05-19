import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix webpack icon issue (chỉ chạy 1 lần)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Fix ô xám khi render trong sticky sidebar
const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => { clearTimeout(t); window.removeEventListener('resize', onResize); };
  }, [map]);
  return null;
};

/**
 * Bản đồ read-only hiển thị vị trí nhà trọ.
 * Click vào bản đồ → mở Google Maps tab mới.
 *
 * @param {number} lat
 * @param {number} lng
 * @param {string} label  - tên địa chỉ hiển thị trong popup
 * @param {string} googleMapsUrl - URL mở Google Maps
 * @param {number} [height=200] - chiều cao bản đồ (px)
 */
const MapView = ({ lat, lng, label, googleMapsUrl, height = 200 }) => {
  const center = [lat, lng];

  return (
    <div
      style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}
      title="Click để mở Google Maps"
    >
      {/* Lớp overlay trong suốt bắt click để mở Google Maps */}
      <a
        href={googleMapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 1000,
          display: 'block',
        }}
        aria-label="Mở Google Maps"
      />

      <MapContainer
        center={center}
        zoom={15}
        style={{ width: '100%', height }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <Marker position={center}>
          {label && <Popup>{label}</Popup>}
        </Marker>
        <InvalidateSize />
      </MapContainer>
    </div>
  );
};

export default MapView;
