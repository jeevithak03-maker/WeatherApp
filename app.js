const weatherService = new WeatherService();

const searchBtn = document.getElementById("searchBtn");
const cityInput = document.getElementById("cityInput");
const weatherResult = document.getElementById("weatherResult");
const unitToggle = document.getElementById("unitToggle");
const modeToggle = document.getElementById("modeToggle");
const favoritesList = document.getElementById("favoritesList");

let lastWeatherData = null;
let lastForecastData = null;
let currentUnit = "celsius";

// --- LocalStorage helpers ---
function getFavorites() { return JSON.parse(localStorage.getItem("favorites")) || []; }
function saveFavorites(cities) { localStorage.setItem("favorites", JSON.stringify(cities)); }
function addFavorite(city) { const cities = getFavorites(); if(!cities.includes(city)){ cities.push(city); saveFavorites(cities); renderFavorites(); } }
function renderFavorites() {
  const cities = getFavorites();
  favoritesList.innerHTML = cities.length === 0 ? "<p>No favorite cities yet</p>" : "";
  cities.forEach(city => {
    const btn = document.createElement("button");
    btn.textContent = city;
    btn.style.margin = "5px";
    btn.addEventListener("click",()=>searchCity(city));
    favoritesList.appendChild(btn);
  });
}

// --- Temperature conversion ---
function convertTemp(temp) { return currentUnit==="celsius"?temp:(temp*9/5+32).toFixed(1); }

// --- Display weather + forecast ---
function displayWeather(data) {
  const temp = convertTemp(data.main.temp);
  let html = `<h2>${data.name}, ${data.sys.country}</h2>
              <p>🌡️ Temperature: ${temp} °${currentUnit==="celsius"?"C":"F"}</p>
              <p>☁️ Weather: ${data.weather[0].description}</p>
              <p>💧 Humidity: ${data.main.humidity}%</p>
              <p>💨 Wind: ${data.wind.speed} m/s</p>
              <button id="addFavoriteBtn">⭐ Add to Favorites</button>`;

  if(lastForecastData){
    html+="<h3>5-Day Forecast:</h3><div id='forecastContainer'>";
    const daily={};
    lastForecastData.list.forEach(item=>{const date=new Date(item.dt*1000).toDateString(); if(!daily[date]) daily[date]=item;});
    Object.values(daily).slice(0,5).forEach(day=>{
      const dayName=new Date(day.dt*1000).toLocaleDateString('en-US',{weekday:'short'});
      const tempMin=convertTemp(day.main.temp_min);
      const tempMax=convertTemp(day.main.temp_max);
      html+=`<div><div><strong>${dayName}</strong></div><div>🌡️ ${tempMin}° / ${tempMax}°</div><div>☁️ ${day.weather[0].description}</div></div>`;
    });
    html+="</div>";
  }

  weatherResult.innerHTML=html;
  document.getElementById("addFavoriteBtn").addEventListener("click",()=>addFavorite(data.name));
}

// --- Fetch weather by city ---
async function searchCity(city){
  weatherResult.innerHTML="Loading... ⏳";
  try{
    const data=await weatherService.getWeather(city);
    lastWeatherData=data;
    try{lastForecastData=await weatherService.getForecast(city);}catch{lastForecastData=null;}
    displayWeather(data);
  }catch{weatherResult.innerHTML="❌ City not found. Try again!"; lastWeatherData=lastForecastData=null;}
}

// --- Fetch weather by coordinates ---
async function fetchWeatherByCoords(lat,lon){
  weatherResult.innerHTML="Loading... ⏳";
  try{
    const resp=await fetch(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    const data=await resp.json(); lastWeatherData=data;
    const forecastResp=await fetch(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    lastForecastData=forecastResp.ok?await forecastResp.json():null;
    displayWeather(data);
  }catch{weatherResult.innerHTML="❌ Unable to get location weather";}
}

// --- Event listeners ---
searchBtn.addEventListener("click",()=>{const city=cityInput.value.trim(); if(!city){weatherResult.innerHTML="⚠️ Please enter a city name"; return;} searchCity(city);});
unitToggle.addEventListener("click",()=>{currentUnit=currentUnit==="celsius"?"fahrenheit":"celsius"; unitToggle.textContent=currentUnit==="celsius"?"Switch to °F":"Switch to °C"; if(lastWeatherData) displayWeather(lastWeatherData);});

// --- Dark/Light mode ---
function setMode(mode){if(mode==="dark"){document.body.classList.add("dark-mode"); modeToggle.textContent="☀️ Light Mode";}else{document.body.classList.remove("dark-mode"); modeToggle.textContent="🌙 Dark Mode";} localStorage.setItem("mode",mode);}
modeToggle.addEventListener("click",()=>{setMode(document.body.classList.contains("dark-mode")?"light":"dark");});

// --- Page load ---
window.addEventListener("load",()=>{
  renderFavorites();
  const savedMode=localStorage.getItem("mode");
  if(savedMode) setMode(savedMode); else { const hour=new Date().getHours(); setMode(hour>=18||hour<6?"dark":"light"); }
  if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>fetchWeatherByCoords(pos.coords.latitude,pos.coords.longitude),()=>{if(getFavorites().length>0) searchCity(getFavorites()[0]);}); }
  else{if(getFavorites().length>0) searchCity(getFavorites()[0]);}
});