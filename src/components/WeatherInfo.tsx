'use client';

import { useEffect, useState } from 'react';

interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
}

interface WeatherInfoProps {
  lat: number;
  lon: number;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('Failed to fetch after retries');
}

export default function WeatherInfo({ lat, lon }: WeatherInfoProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchWithRetry(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation`
        );

        const data = await response.json();
        
        if (!data.current) {
          throw new Error('Invalid weather data format');
        }

        setWeather({
          temperature: data.current.temperature_2m,
          windSpeed: data.current.wind_speed_10m,
          windDirection: data.current.wind_direction_10m,
          precipitation: data.current.precipitation
        });
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Weather data temporarily unavailable');
      } finally {
        setLoading(false);
      }
    };

    if (lat && lon) {
      fetchWeather();
    }
  }, [lat, lon]);

  if (loading) {
    return (
      <div className="weather-loading">
        <div className="loading-spinner"></div>
        <style jsx>{`
          .weather-loading {
            padding: 12px;
            text-align: center;
            color: #666;
          }
          .loading-spinner {
            border: 2px solid #f3f3f3;
            border-top: 2px solid #1a73e8;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
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
      <div className="weather-error">
        <style jsx>{`
          .weather-error {
            padding: 8px;
            color: #721c24;
            background-color: #f8d7da;
            border: 1px solid #f5c6cb;
            border-radius: 4px;
            font-size: 13px;
            text-align: center;
          }
        `}</style>
        {error}
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="weather-info">
      <style jsx>{`
        .weather-info {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 16px;
          margin-top: 12px;
        }
        .weather-title {
          font-weight: 600;
          color: #1a73e8;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .weather-data {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .weather-item {
          background: #f8f9fa;
          padding: 8px;
          border-radius: 6px;
          font-size: 13px;
        }
        .weather-label {
          color: #666;
          font-size: 12px;
          margin-bottom: 4px;
        }
        .weather-value {
          color: #333;
          font-weight: 500;
          font-size: 14px;
        }
      `}</style>
      <div className="weather-title">Current Weather</div>
      <div className="weather-data">
        <div className="weather-item">
          <div className="weather-label">Temperature</div>
          <div className="weather-value">{weather.temperature}°C</div>
        </div>
        <div className="weather-item">
          <div className="weather-label">Wind Speed</div>
          <div className="weather-value">{weather.windSpeed} km/h</div>
        </div>
        <div className="weather-item">
          <div className="weather-label">Wind Direction</div>
          <div className="weather-value">{weather.windDirection}°</div>
        </div>
        <div className="weather-item">
          <div className="weather-label">Precipitation</div>
          <div className="weather-value">{weather.precipitation} mm</div>
        </div>
      </div>
    </div>
  );
} 