class WeatherService {
  async getWeather(city) {
    const url = `${BASE_URL}/weather?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");
    return await response.json();
  }

  async getForecast(city) {
    const url = `${BASE_URL}/forecast?q=${city}&units=metric&appid=${API_KEY}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Forecast not found");
    return await response.json();
  }
}