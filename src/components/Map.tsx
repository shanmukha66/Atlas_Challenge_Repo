'use client';

import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BalloonData, fetchHistoricalData } from '@/services/balloonService';
import WeatherInfo from './WeatherInfo';

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom popup style
const customPopupStyle = {
  className: 'balloon-popup',
  minWidth: 250,
  maxWidth: 350,
  closeButton: true,
  autoClose: false
};

// Default center coordinates
const DEFAULT_CENTER: [number, number] = [37.7749, -122.4194];
const DEFAULT_ZOOM = 3;

// Generate a random color for each balloon's trajectory
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

export default function Map() {
  const [balloonData, setBalloonData] = useState<BalloonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBalloon, setSelectedBalloon] = useState<BalloonData | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHistoricalData();
      if (data.length === 0) {
        throw new Error('No balloon data available');
      }
      setBalloonData(data);
      setSelectedBalloon(data[0]); // Select the most recent balloon by default
      setError(null);
    } catch (err) {
      console.error('Error fetching balloon data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [fetchData]);

  // Group balloons by timestamp to show trajectories
  const balloonsByTimestamp = balloonData.reduce((acc, balloon) => {
    const timestamp = balloon.timestamp;
    if (!acc[timestamp]) {
      acc[timestamp] = [];
    }
    acc[timestamp].push(balloon);
    return acc;
  }, {} as Record<string, BalloonData[]>);

  // Sort timestamps to get the most recent first
  const timestamps = Object.keys(balloonsByTimestamp).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Get the most recent balloon positions
  const currentBalloons = timestamps.length > 0 ? balloonsByTimestamp[timestamps[0]] : [];
  const center = currentBalloons.length > 0 
    ? [currentBalloons[0].latitude, currentBalloons[0].longitude] as [number, number]
    : DEFAULT_CENTER;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <div className="loading-text">Loading balloon data...</div>
        <style jsx>{`
          .loading-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #f8f9fa;
          }
          .loading-spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #1a73e8;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            margin-top: 16px;
            color: #666;
            font-size: 16px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchData} className="retry-button">Retry</button>
        <style jsx>{`
          .error-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            padding: 20px;
            background: #f8f9fa;
          }
          .error-message {
            color: #721c24;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            padding: 12px 20px;
            margin-bottom: 16px;
            text-align: center;
          }
          .retry-button {
            background: #1a73e8;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          .retry-button:hover {
            background: #1557b0;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        .balloon-popup .leaflet-popup-content-wrapper {
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }
        .balloon-popup .leaflet-popup-content {
          margin: 12px;
          font-size: 14px;
          line-height: 1.4;
        }
        .balloon-info {
          padding: 8px;
        }
        .balloon-info h3 {
          margin: 0 0 8px 0;
          color: #1a73e8;
          font-size: 16px;
        }
        .balloon-info p {
          margin: 4px 0;
          color: #333;
        }
        .balloon-coordinates {
          font-family: monospace;
          background: #f5f5f5;
          padding: 8px;
          border-radius: 4px;
          margin: 8px 0;
        }
      `}</style>
      <div className="relative w-full h-screen">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Display current balloon positions */}
          {currentBalloons.map((balloon, index) => (
            <Marker
              key={`current-${index}`}
              position={[balloon.latitude, balloon.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => setSelectedBalloon(balloon)
              }}
            >
              <Popup options={customPopupStyle}>
                <div className="balloon-info">
                  <h3>Balloon {index + 1}</h3>
                  <p><strong>Time:</strong> {new Date(balloon.timestamp).toLocaleString()}</p>
                  <p><strong>Altitude:</strong> {balloon.altitude.toFixed(2)} km</p>
                  <div className="balloon-coordinates">
                    <p><strong>Lat:</strong> {balloon.latitude.toFixed(4)}°</p>
                    <p><strong>Lon:</strong> {balloon.longitude.toFixed(4)}°</p>
                  </div>
                  <WeatherInfo lat={balloon.latitude} lon={balloon.longitude} />
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Display balloon trajectories */}
          {currentBalloons.map((balloon, index) => {
            const positions = timestamps.map(timestamp => {
              const matchingBalloon = balloonsByTimestamp[timestamp][index];
              return matchingBalloon 
                ? [matchingBalloon.latitude, matchingBalloon.longitude] as [number, number]
                : null;
            }).filter((pos): pos is [number, number] => pos !== null);

            return positions.length > 1 && (
              <Polyline
                key={`trajectory-${index}`}
                positions={positions}
                color={getRandomColor()}
                weight={3}
                opacity={0.8}
              />
            );
          })}
        </MapContainer>
      </div>
    </>
  );
} 