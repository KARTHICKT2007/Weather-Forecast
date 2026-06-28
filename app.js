/* ==========================================================================
   Application State & DOM Elements
   ========================================================================== */
const DOM = {
    searchInput: document.getElementById('city-search-input'),
    searchBtn: document.getElementById('search-button'),
    currentLocationBtn: document.getElementById('current-location-btn'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-title') ? document.getElementById('error-state') : null,
    errorTitle: document.getElementById('error-title'),
    errorMessage: document.getElementById('error-message'),
    retryBtn: document.getElementById('retry-btn'),
    weatherDashboard: document.getElementById('weather-dashboard'),
    
    // Current Weather Elements
    locationName: document.getElementById('location-name'),
    currentDateTime: document.getElementById('current-date-time'),
    currentTempF: document.getElementById('current-temp-f'),
    currentTempC: document.getElementById('current-temp-c'),
    currentWeatherIcon: document.getElementById('current-weather-icon'),
    weatherDescription: document.getElementById('weather-description'),
    tempMin: document.getElementById('temp-min'),
    tempMax: document.getElementById('temp-max'),
    
    // Metric Elements
    metricFeelsLike: document.getElementById('metric-feels-like'),
    metricHumidity: document.getElementById('metric-humidity'),
    metricWind: document.getElementById('metric-wind'),
    metricUV: document.getElementById('metric-uv'),
    feelsLikeDesc: document.getElementById('feels-like-desc'),
    humidityDesc: document.getElementById('humidity-desc'),
    windDesc: document.getElementById('wind-desc'),
    uvDesc: document.getElementById('uv-desc'),
    
    // Forecast Containers
    hourlyContainer: document.getElementById('hourly-forecast-container'),
    dailyContainer: document.getElementById('daily-forecast-container')
};

// Current Active Search State
let currentSearchCity = "New York";

/* ==========================================================================
   Weather Code (WMO) Dictionary to Icons & Descriptions
   ========================================================================== */
const weatherCodes = {
    0: { desc: "Clear Sky", icon: "fa-solid fa-sun", color: "#FFB703" },
    1: { desc: "Mainly Clear", icon: "fa-solid fa-cloud-sun", color: "#E3A857" },
    2: { desc: "Partly Cloudy", icon: "fa-solid fa-cloud-sun", color: "#C4D1C9" },
    3: { desc: "Overcast", icon: "fa-solid fa-cloud", color: "#95A59C" },
    45: { desc: "Foggy", icon: "fa-solid fa-smog", color: "#95A59C" },
    48: { desc: "Depositing Rime Fog", icon: "fa-solid fa-smog", color: "#95A59C" },
    51: { desc: "Light Drizzle", icon: "fa-solid fa-cloud-rain", color: "#789988" },
    53: { desc: "Moderate Drizzle", icon: "fa-solid fa-cloud-rain", color: "#789988" },
    55: { desc: "Dense Drizzle", icon: "fa-solid fa-cloud-showers-heavy", color: "#4A6B5D" },
    56: { desc: "Light Freezing Drizzle", icon: "fa-solid fa-cloud-meatball", color: "#C4D1C9" },
    57: { desc: "Dense Freezing Drizzle", icon: "fa-solid fa-cloud-meatball", color: "#C4D1C9" },
    61: { desc: "Slight Rain", icon: "fa-solid fa-cloud-rain", color: "#789988" },
    63: { desc: "Moderate Rain", icon: "fa-solid fa-cloud-showers-heavy", color: "#4A6B5D" },
    65: { desc: "Heavy Rain", icon: "fa-solid fa-cloud-showers-heavy", color: "#2D3A34" },
    66: { desc: "Light Freezing Rain", icon: "fa-solid fa-cloud-sleet", color: "#C4D1C9" },
    67: { desc: "Heavy Freezing Rain", icon: "fa-solid fa-cloud-sleet", color: "#95A59C" },
    71: { desc: "Slight Snowfall", icon: "fa-solid fa-snowflake", color: "#F4F7F5" },
    73: { desc: "Moderate Snowfall", icon: "fa-solid fa-snowflake", color: "#F4F7F5" },
    75: { desc: "Heavy Snowfall", icon: "fa-solid fa-snowstorm", color: "#F4F7F5" },
    77: { desc: "Snow Grains", icon: "fa-solid fa-icicles", color: "#F4F7F5" },
    80: { desc: "Slight Rain Showers", icon: "fa-solid fa-cloud-rain", color: "#789988" },
    81: { desc: "Moderate Rain Showers", icon: "fa-solid fa-cloud-showers-heavy", color: "#4A6B5D" },
    82: { desc: "Violent Rain Showers", icon: "fa-solid fa-cloud-showers-heavy", color: "#2D3A34" },
    85: { desc: "Slight Snow Showers", icon: "fa-solid fa-snowflake", color: "#F4F7F5" },
    86: { desc: "Heavy Snow Showers", icon: "fa-solid fa-snowstorm", color: "#F4F7F5" },
    95: { desc: "Thunderstorm", icon: "fa-solid fa-cloud-bolt", color: "#FFB703" },
    96: { desc: "Thunderstorm with Hail", icon: "fa-solid fa-cloud-bolt", color: "#FFB703" },
    99: { desc: "Heavy Thunderstorm with Hail", icon: "fa-solid fa-cloud-bolt", color: "#FFB703" }
};

function getWeatherMeta(code) {
    return weatherCodes[code] || { desc: "Uncertain Weather", icon: "fa-solid fa-cloud", color: "#C4D1C9" };
}

/* ==========================================================================
   View State Management
   ========================================================================== */
function showLoading() {
    DOM.loadingState.classList.remove('hidden');
    if (DOM.errorState) DOM.errorState.classList.add('hidden');
    DOM.weatherDashboard.classList.add('hidden');
}

function showError(title, message) {
    DOM.loadingState.classList.add('hidden');
    if (DOM.errorState) DOM.errorState.classList.remove('hidden');
    DOM.weatherDashboard.classList.add('hidden');
    if (DOM.errorTitle) DOM.errorTitle.textContent = title;
    if (DOM.errorMessage) DOM.errorMessage.textContent = message;
}

function showDashboard() {
    DOM.loadingState.classList.add('hidden');
    if (DOM.errorState) DOM.errorState.classList.add('hidden');
    DOM.weatherDashboard.classList.remove('hidden');
}

/* ==========================================================================
   Data Fetching & Processing
   ========================================================================== */
async function fetchWeatherByCity(cityName) {
    showLoading();
    currentSearchCity = cityName;
    try {
        // 1. Geocoding API to get Latitude & Longitude
        const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            showError("City Not Found", `We couldn't locate "${cityName}". Please check the spelling and try again.`);
            return;
        }

        const location = geoData.results[0];
        const { latitude, longitude, name, country, admin1 } = location;
        const displayName = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;

        // 2. Fetch Weather Data from Open-Meteo
        await fetchWeatherData(latitude, longitude, displayName);
    } catch (err) {
        console.error("Error fetching geocoding data:", err);
        showError("Network Error", "Unable to establish a connection to the weather servers. Please check your internet connection.");
    }
}

async function fetchWeatherData(lat, lon, locationDisplayName) {
    try {
        const weatherURL = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto`;
        const response = await fetch(weatherURL);
        const data = await response.json();

        updateUI(data, locationDisplayName);
        showDashboard();
    } catch (err) {
        console.error("Error fetching weather data:", err);
        showError("Data Error", "Successfully located the city, but encountered an error retrieving weather forecasts.");
    }
}

/* ==========================================================================
   Dynamic UI Updating (Dual Fahrenheit & Celsius Display)
   ========================================================================== */
function updateUI(data, locationName) {
    const current = data.current;
    const daily = data.daily;
    const hourly = data.hourly;

    // 1. Header & Location Info
    DOM.locationName.textContent = locationName;
    const now = new Date();
    const options = { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
    DOM.currentDateTime.textContent = now.toLocaleDateString('en-US', options);

    // 2. Current Weather Card (Dual Display)
    const currentMeta = getWeatherMeta(current.weather_code);
    const tempF = Math.round(current.temperature_2m);
    const tempC = Math.round((tempF - 32) * 5 / 9);
    
    if (DOM.currentTempF) DOM.currentTempF.textContent = tempF;
    if (DOM.currentTempC) DOM.currentTempC.textContent = tempC;
    
    DOM.weatherDescription.textContent = currentMeta.desc;
    DOM.currentWeatherIcon.className = `${currentMeta.icon} condition-icon`;
    DOM.currentWeatherIcon.style.color = currentMeta.color;

    const minF = Math.round(daily.temperature_2m_min[0]);
    const minC = Math.round((minF - 32) * 5 / 9);
    const maxF = Math.round(daily.temperature_2m_max[0]);
    const maxC = Math.round((maxF - 32) * 5 / 9);
    DOM.tempMin.textContent = `${minF}°F / ${minC}°C`;
    DOM.tempMax.textContent = `${maxF}°F / ${maxC}°C`;

    // 3. Atmospheric Metrics (Dual Display for Feels Like)
    const feelsF = Math.round(current.apparent_temperature);
    const feelsC = Math.round((feelsF - 32) * 5 / 9);
    DOM.metricFeelsLike.textContent = `${feelsF}°F / ${feelsC}°C`;
    
    DOM.metricHumidity.textContent = `${Math.round(current.relative_humidity_2m)}%`;
    DOM.metricWind.textContent = `${Math.round(current.wind_speed_10m)} mph`;
    
    const uvMax = daily.uv_index_max[0] !== null ? Math.round(daily.uv_index_max[0]) : 3;
    DOM.metricUV.textContent = uvMax;

    // Set descriptive subtexts based on values
    DOM.feelsLikeDesc.textContent = current.apparent_temperature > 85 ? "Warm & balmy garden" : current.apparent_temperature < 50 ? "Crisp & cool breeze" : "Perfect garden weather";
    DOM.humidityDesc.textContent = current.relative_humidity_2m > 65 ? "Humid & dewy" : current.relative_humidity_2m < 30 ? "Dry ambient air" : "Comfortable & fresh";
    DOM.windDesc.textContent = current.wind_speed_10m > 20 ? "Brisk windy weather" : current.wind_speed_10m > 10 ? "Gentle floral breeze" : "Calm & peaceful";
    DOM.uvDesc.textContent = uvMax > 7 ? "Very high sun exposure" : uvMax > 5 ? "High sun exposure" : uvMax > 2 ? "Moderate sun exposure" : "Low sun exposure";

    // 4. Hourly Forecast Slider (Dual Display)
    DOM.hourlyContainer.innerHTML = '';
    const currentHourIndex = now.getHours();
    for (let i = currentHourIndex; i < currentHourIndex + 24; i += 2) {
        if (i >= hourly.temperature_2m.length) break;
        
        const hTempF = Math.round(hourly.temperature_2m[i]);
        const hTempC = Math.round((hTempF - 32) * 5 / 9);
        const code = hourly.weather_code[i];
        const meta = getWeatherMeta(code);
        
        // Format Time
        const timeString = hourly.time[i];
        const dateObj = new Date(timeString);
        let hourFormatted = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
        if (i === currentHourIndex) hourFormatted = "Now";

        const hourlyItem = document.createElement('div');
        hourlyItem.className = 'hourly-item';
        hourlyItem.innerHTML = `
            <span class="hourly-time">${hourFormatted}</span>
            <i class="${meta.icon} hourly-icon" style="color: ${meta.color}"></i>
            <span class="hourly-temp">${hTempF}°F <span style="color: var(--color-gold-accent); font-size: 0.95rem;">(${hTempC}°C)</span></span>
        `;
        DOM.hourlyContainer.appendChild(hourlyItem);
    }

    // 5. 7-Day Daily Outlook (Dual Display)
    DOM.dailyContainer.innerHTML = '';
    for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i] + 'T00:00:00');
        const dayName = i === 0 ? "Today" : dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const meta = getWeatherMeta(daily.weather_code[i]);
        
        const dMinF = Math.round(daily.temperature_2m_min[i]);
        const dMinC = Math.round((dMinF - 32) * 5 / 9);
        const dMaxF = Math.round(daily.temperature_2m_max[i]);
        const dMaxC = Math.round((dMaxF - 32) * 5 / 9);

        const dailyItem = document.createElement('div');
        dailyItem.className = 'daily-item';
        dailyItem.innerHTML = `
            <span class="daily-day">${dayName}</span>
            <div class="daily-condition">
                <i class="${meta.icon} daily-icon" style="color: ${meta.color}"></i>
            </div>
            <span class="daily-desc">${meta.desc}</span>
            <div class="daily-temps">
                <span class="temp-min">${dMinF}°F (${dMinC}°C)</span>
                <span class="temp-max">${dMaxF}°F (${dMaxC}°C)</span>
            </div>
        `;
        DOM.dailyContainer.appendChild(dailyItem);
    }
}

/* ==========================================================================
   Event Listeners & Initialization
   ========================================================================== */
function handleSearch() {
    const query = DOM.searchInput.value.trim();
    if (query) {
        fetchWeatherByCity(query);
        DOM.searchInput.value = '';
    }
}

if (DOM.searchBtn) DOM.searchBtn.addEventListener('click', handleSearch);

if (DOM.searchInput) {
    DOM.searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
}

if (DOM.retryBtn) {
    DOM.retryBtn.addEventListener('click', () => {
        fetchWeatherByCity(currentSearchCity);
    });
}

if (DOM.currentLocationBtn) {
    DOM.currentLocationBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        showLoading();
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                await fetchWeatherData(latitude, longitude, "Current Location");
            },
            (error) => {
                console.error("Error getting geolocation:", error);
                alert("Unable to retrieve your location. Falling back to default city.");
                fetchWeatherByCity(currentSearchCity);
            }
        );
    });
}

// Initial Fetch on Load
document.addEventListener('DOMContentLoaded', () => {
    fetchWeatherByCity(currentSearchCity);
});
