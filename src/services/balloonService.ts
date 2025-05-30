export interface BalloonData {
  latitude: number;
  longitude: number;
  altitude: number;
  timestamp: string;
}

interface BalloonPosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

const CACHE_DURATION = 60000; // 1 minute
let dataCache: {
  timestamp: number;
  data: BalloonData[];
} | null = null;

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  throw lastError || new Error('Failed to fetch after retries');
}

export async function fetchBalloonData(hour: number = 0): Promise<BalloonData[]> {
  const paddedHour = hour.toString().padStart(2, '0');
  const url = `/api/balloon?hour=${paddedHour}`;
  const timestamp = new Date(Date.now() - hour * 3600000).toISOString();
  
  try {
    const response = await fetchWithRetry(url);
    const data = await response.json();
    
    if (Array.isArray(data)) {
      return data.map((balloon: BalloonPosition) => ({
        ...balloon,
        timestamp
      }));
    }

    if (data.error) {
      console.error(`API Error for hour ${hour}:`, data.error);
    }

    return [];
  } catch (error) {
    console.error(`Error fetching balloon data for hour ${hour}:`, error);
    return [];
  }
}

export async function fetchHistoricalData(hours: number = 23): Promise<BalloonData[]> {
  // Check cache first
  if (dataCache && (Date.now() - dataCache.timestamp) < CACHE_DURATION) {
    return dataCache.data;
  }

  // Start with current hour and a few recent hours
  const keyHours = [0, 1, 2, 3];
  const results: BalloonData[] = [];
  
  // Try to get at least some data
  for (const hour of keyHours) {
    try {
      const data = await fetchBalloonData(hour);
      if (data.length > 0) {
        results.push(...data);
      }
      
      // If we have some data, we can stop trying more hours
      if (results.length > 0) {
        break;
      }
      
      // Small delay between requests
      if (hour !== keyHours[keyHours.length - 1]) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Error fetching data for hour ${hour}:`, error);
    }
  }

  // Update cache if we got any data
  if (results.length > 0) {
    dataCache = {
      timestamp: Date.now(),
      data: results
    };
  }

  // If no data found, return empty array
  return results.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
} 