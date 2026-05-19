import React, { useState, useCallback, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Input } from 'antd';
import { SearchOutlined, EnvironmentFilled } from '@ant-design/icons';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const DEFAULT_CENTER = [21.0285, 105.8542]; // Hà Nội

// Fix lỗi ô xám: gọi invalidateSize sau khi container thực sự hiển thị
const InvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    // Delay nhỏ để chờ animation của Modal/Drawer kết thúc
    const timer = setTimeout(() => map.invalidateSize(), 200);
    // Cũng invalidate khi resize cửa sổ
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

// Xử lý click trên bản đồ
const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

// Di chuyển bản đồ đến vị trí mới sau khi search
const RecenterMap = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 16);
  }, [center, map]);
  return null;
};

const MapPicker = ({ initialPosition, onChange }) => {
  const [markerPosition, setMarkerPosition] = useState(
    initialPosition?.lat && initialPosition?.lng
      ? [initialPosition.lat, initialPosition.lng]
      : DEFAULT_CENTER
  );
  const [searchCenter, setSearchCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const markerRef = useRef(null);

  const updatePosition = useCallback(
    (lat, lng) => {
      setMarkerPosition([lat, lng]);
      if (onChange) onChange({ lat, lng });
    },
    [onChange]
  );

  const handleMapClick = useCallback(
    (lat, lng) => updatePosition(lat, lng),
    [updatePosition]
  );

  const handleMarkerDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (marker) {
      const { lat, lng } = marker.getLatLng();
      updatePosition(lat, lng);
    }
  }, [updatePosition]);

  // Geocoding miễn phí qua Nominatim (OpenStreetMap)
  const handleSearch = useCallback(
    async (value) => {
      if (!value?.trim()) return;
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            value + ', Vietnam'
          )}&limit=1`,
          { headers: { 'Accept-Language': 'vi' } }
        );
        const data = await res.json();
        if (data?.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          updatePosition(lat, lng);
          setSearchCenter([lat, lng]);
        }
      } catch (err) {
        console.error('Geocoding error:', err);
      } finally {
        setSearching(false);
      }
    },
    [updatePosition]
  );

  return (
    <div>
      <div style={{ marginBottom: 12 }}>
        <Input.Search
          id="map-search-box"
          size="large"
          placeholder="Tìm kiếm địa chỉ trên bản đồ..."
          prefix={<SearchOutlined style={{ color: '#1890ff' }} />}
          enterButton="Tìm"
          loading={searching}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={handleSearch}
          allowClear
          style={{ borderRadius: '8px' }}
        />
      </div>

      <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #d9d9d9' }}>
        <MapContainer
          center={markerPosition}
          zoom={14}
          style={{ width: '100%', height: '350px' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
          <Marker
            position={markerPosition}
            draggable={true}
            ref={markerRef}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <InvalidateSize />
          {searchCenter && <RecenterMap center={searchCenter} />}
        </MapContainer>
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '13px',
          color: '#8c8c8c',
        }}
      >
        <EnvironmentFilled style={{ color: '#1890ff' }} />
        <span>
          Tọa độ: {markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}
        </span>
      </div>
    </div>
  );
};

export default MapPicker;
