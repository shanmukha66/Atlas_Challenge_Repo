# Balloon Constellation Tracker

A web application that tracks and visualizes balloon constellation data in real-time, combining data from the Windborne Systems API with weather information.

![Balloon Constellation Tracker Screenshot](Weather.png)

## Features

- Real-time tracking of balloon positions with detailed information popups
- Interactive map with custom markers and trajectory lines
- Historical data visualization (23-hour history)
- Live weather information for each balloon location including:
  - Temperature
  - Wind speed and direction
  - Precipitation
- Automatic data updates every minute
- Responsive design with error handling and retry logic

## Technologies Used

- Next.js 15.3.3
- React 19
- TypeScript
- Leaflet for mapping
- Open-Meteo API for weather data
- Windborne Systems API for balloon data
- TailwindCSS for styling

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features in Detail

### Balloon Tracking
- Real-time position updates
- Altitude tracking
- Historical trajectory visualization
- Custom markers with detailed popups

### Weather Integration
- Current temperature
- Wind speed and direction
- Precipitation data
- Automatic updates with retry logic

### Map Features
- Interactive zoom and pan
- Custom marker icons
- Trajectory lines with unique colors
- Responsive popup design

## Deployment

The application is built for deployment on various platforms. To build for production:

```bash
npm run build
npm start
```

## API Endpoints

- `/api/balloon?hour=XX` - Get balloon positions for a specific hour (00-23)
- Weather data is fetched directly from Open-Meteo API

## Error Handling

The application includes robust error handling:
- Automatic retries for failed API calls
- Graceful fallbacks for missing data
- User-friendly error messages
- Loading states for better UX

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
