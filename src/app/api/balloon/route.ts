import { NextResponse } from 'next/server';

interface BalloonPosition {
  latitude: number;
  longitude: number;
  altitude: number;
}

function parseRawBalloonData(text: string): BalloonPosition[] {
  try {
    // Debug log the raw response
    console.log('Raw API response:', text);

    // If the response is HTML or other invalid format, return empty array
    if (text.includes('<html') || text.includes('<!DOCTYPE')) {
      return [];
    }

    // Remove any whitespace and format the text for parsing
    const cleanText = text
      .replace(/\s+/g, '')  // Remove all whitespace
      .replace(/\[[\s\n]*\[/, '[[')  // Fix nested array start
      .replace(/\][\s\n]*\]/, ']]')  // Fix nested array end
      .replace(/\],[\s\n]*\[/g, '],['); // Fix array separators

    console.log('Cleaned text:', cleanText);

    // Try to parse as JSON first
    try {
      const jsonData = JSON.parse(cleanText);
      if (Array.isArray(jsonData)) {
        return jsonData.map(item => {
          if (Array.isArray(item) && item.length >= 3) {
            const [lat, lon, alt] = item.map(Number);
            if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
              return { latitude: lat, longitude: lon, altitude: alt };
            }
          }
          return null;
        }).filter((item): item is BalloonPosition => item !== null);
      }
    } catch (e) {
      console.log('JSON parse failed, trying regex parsing');
    }

    // Fallback to regex parsing if JSON parse fails
    const matches = cleanText.match(/\[([-\d.]+),([-\d.]+),([-\d.]+)\]/g);
    console.log('Regex matches:', matches);
    
    if (!matches) {
      return [];
    }

    return matches.map(match => {
      const [lat, lon, alt] = match
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(Number);

      if (isNaN(lat) || isNaN(lon) || isNaN(alt)) {
        return null;
      }

      return {
        latitude: lat,
        longitude: lon,
        altitude: alt
      };
    }).filter((item): item is BalloonPosition => item !== null);
  } catch (error) {
    console.error('Error parsing balloon data:', error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hour = searchParams.get('hour') || '00';
  
  try {
    const response = await fetch(`https://a.windbornesystems.com/treasure/${hour}.json`, {
      headers: {
        'Accept': '*/*',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
      return NextResponse.json(
        { error: `Failed to fetch balloon data: ${response.status}` },
        { status: response.status }
      );
    }

    const text = await response.text();
    const balloons = parseRawBalloonData(text);
    
    // Return empty array instead of error if no positions found
    return NextResponse.json(balloons);
  } catch (error) {
    console.error(`Error fetching balloon data for hour ${hour}:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch balloon data', hour },
      { status: 500 }
    );
  }
} 