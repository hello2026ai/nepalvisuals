export interface DailyForecast {
  day: string;
  condition: string;
  high: number;
  low: number;
}

export const WeatherService = {
  async getForecast(lat: number, lon: number): Promise<DailyForecast[]> {
    try {
      // Fetch 7 days of weather data
      // Using daily=weathercode,temperature_2m_max,temperature_2m_min
      const params = new URLSearchParams({
        latitude: lat.toString(),
        longitude: lon.toString(),
        daily: 'weather_code,temperature_2m_max,temperature_2m_min',
        timezone: 'auto',
        forecast_days: '7'
      });

      const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.statusText}`);
      }

      const data = await response.json();
      const { daily } = data;
      
      if (!daily) {
        throw new Error('No weather data received');
      }

      return daily.time.map((time: string, index: number) => {
        const date = new Date(time);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
        const code = daily.weather_code[index];
        const high = Math.round(daily.temperature_2m_max[index]);
        const low = Math.round(daily.temperature_2m_min[index]);
        const condition = getWeatherCondition(code);

        return {
          day: dayName,
          condition,
          high,
          low
        };
      });

    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return empty array or throw, depending on how we want to handle it.
      // Returning empty allows the UI to handle "no data" gracefully or show a fallback.
      return [];
    }
  },

  async getCoordinates(locationName: string): Promise<{ lat: number; lon: number } | null> {
    try {
        const params = new URLSearchParams({
            name: locationName,
            count: '1',
            language: 'en',
            format: 'json'
        });
        
        const url = `https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Geocoding API error: ${response.statusText}`);
        
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const { latitude, longitude } = data.results[0];
            return { lat: latitude, lon: longitude };
        }
        return null;
    } catch (error) {
        console.error('Error geocoding location:', error);
        return null;
    }
  }
};

// Helper to map WMO weather codes to string conditions
// https://open-meteo.com/en/docs
function getWeatherCondition(code: number): string {
  if (code === 0) return 'Sunny';
  if (code === 1 || code === 2 || code === 3) return 'Partly Cloudy';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 56 && code <= 57) return 'Freezing Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 66 && code <= 67) return 'Freezing Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 85 && code <= 86) return 'Snow Showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96 && code <= 99) return 'Thunderstorm with Hail';
  return 'Cloudy'; // Default fallback
}
