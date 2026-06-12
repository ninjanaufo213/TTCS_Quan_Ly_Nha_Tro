import React, { useState, useEffect } from 'react';
import { Modal, Button } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const InvalidateMapSize = () => {
  const map = useMap();
  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(map.getContainer());

    const t1 = setTimeout(() => map.invalidateSize(), 200);
    const t2 = setTimeout(() => map.invalidateSize(), 500);
    const t3 = setTimeout(() => map.invalidateSize(), 1000);
    const t4 = setTimeout(() => map.invalidateSize(), 1500);
    
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    
    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
};

const FitBounds = ({ listings }) => {
  const map = useMap();
  useEffect(() => {
    const validCoords = listings.filter(l => l.latitude && l.longitude).map(l => [l.latitude, l.longitude]);
    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [listings, map]);
  return null;
};

const formatShortPrice = (price) => {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1).replace('.0', '')}Tr`;
  }
  return `${price / 1000}K`;
};

const createPriceMarker = (price, isActive) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="modern-price-marker ${isActive ? 'active-marker' : ''}">${formatShortPrice(price)}</div>`,
    iconSize: null,
    iconAnchor: [20, 14]
  });
};

const MapBoundsListener = ({ setMapBounds }) => {
  const map = useMapEvents({
    moveend: () => {
      setMapBounds(map.getBounds());
    },
    zoomend: () => {
      setMapBounds(map.getBounds());
    }
  });

  useEffect(() => {
    setMapBounds(map.getBounds());
  }, [map, setMapBounds]);

  return null;
};

const HomePageMapModal = ({ visible, onClose, filteredListings, formatPrice }) => {
  const navigate = useNavigate();
  const [activeMapListingId, setActiveMapListingId] = useState(null);
  const [mapBounds, setMapBounds] = useState(null);

  const visibleListingsInMap = React.useMemo(() => {
    if (!visible || !mapBounds) return filteredListings;
    return filteredListings.filter(l => {
      if (!l.latitude || !l.longitude) return false;
      return mapBounds.contains([l.latitude, l.longitude]);
    });
  }, [filteredListings, visible, mapBounds]);

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onClose}
      footer={null}
      width="95vw"
      style={{ top: 20, padding: 0 }}
      bodyStyle={{ padding: 0, height: 'calc(100vh - 80px)', overflow: 'hidden' }}
      closeIcon={<Button shape="circle" icon={<CloseCircleOutlined />} size="large" />}
    >
      <div className="map-modal-container">
        <div className="map-sidebar">
          <h2 style={{ padding: '20px 20px 0', margin: 0, fontSize: '20px', fontWeight: 700 }}>Danh sách phòng</h2>
          <p style={{ padding: '0 20px 16px', margin: 0, color: '#64748b' }}>
            Hiển thị {visibleListingsInMap.length} kết quả trong khu vực
          </p>
          <div className="map-sidebar-list">
            {visibleListingsInMap.map((listing) => (
               <div 
                 key={listing.id} 
                 className={`map-sidebar-item ${activeMapListingId === listing.id ? 'active' : ''}`}
                 onMouseEnter={() => setActiveMapListingId(listing.id)}
                 onClick={() => navigate(`/listings/${listing.id}`)}
               >
                 <img src={listing.images[0]} alt={listing.title} />
                 <div className="map-sidebar-info">
                   <div className="title">{listing.title}</div>
                   <div className="price">{formatPrice(listing.price)}/tháng</div>
                   <div className="meta">{listing.area ? `${listing.area} m²` : ''}</div>
                 </div>
               </div>
            ))}
          </div>
        </div>
        <div className="map-content">
          {visible && (
            <MapContainer 
              center={[21.0285, 105.8542]}
              zoom={13} 
              style={{ width: '100%', height: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                maxZoom={20}
              />
              <MapBoundsListener setMapBounds={setMapBounds} />
              <InvalidateMapSize />
              <FitBounds listings={filteredListings} />
              {filteredListings.filter(l => l.latitude && l.longitude).map(listing => (
                <Marker 
                  key={listing.id} 
                  position={[listing.latitude, listing.longitude]}
                  icon={createPriceMarker(listing.price, activeMapListingId === listing.id)}
                  eventHandlers={{
                    click: () => setActiveMapListingId(listing.id)
                  }}
                >
                  <Popup closeButton={false} className="custom-map-popup">
                    <div className="map-popup-card" onClick={() => navigate(`/listings/${listing.id}`)}>
                      <img src={listing.images[0]} alt={listing.title} />
                      <div className="map-popup-info">
                        <div className="map-popup-title">{listing.title}</div>
                        <div className="map-popup-price">{formatPrice(listing.price)}/tháng</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default HomePageMapModal;
