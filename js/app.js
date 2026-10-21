let currentController = null;

async function loadWeather() {
    const city = document.getElementById('city').value.trim();
    const temperatureElement = document.getElementById('temperature');

    if (!city) {
        temperatureElement.textContent = 'Input city';
        return;
    }

    if (currentController) {
        currentController.abort();
    }

    currentController = new AbortController();
    const signal = currentController.signal;

    temperatureElement.textContent = 'Loading...';
    temperatureElement.classList.remove('cached');

    try {
        const encodedCity = encodeURIComponent(city);

        const geoUrl =
            `https://nominatim.openstreetmap.org/search?q=${encodedCity}&format=json&limit=1&accept-language=ru`;

        const geoResponse = await fetchWithRetry(geoUrl, { signal });

        const geoData = await geoResponse.json();

        if (!geoData || geoData.length === 0) {
            temperatureElement.textContent = 'City not found';
            return;
        }

        const { lat, lon, display_name } = geoData[0];

        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        const name = display_name.split(',')[0];

        const weatherUrl =
            `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${latitude}&lon=${longitude}`;

        const weatherResponse = await fetchWithRetry(weatherUrl,{ signal });

        const data = await weatherResponse.json();

        const temperature =
            data.properties.timeseries[0]
                .data.instant.details.air_temperature;

        saveWeatherToCache(city, {
            name,
            temperature
        });
        localStorage.setItem('lastCity', city);


        temperatureElement.textContent =
            `${name}: ${temperature} °C`;

        temperatureElement.classList.remove('cached');

    } catch (error) {

        if (error.name === 'AbortError') {
            console.log('Request canceled');
            return;
        }

        console.error('Loading error:', error);

        const cached = getWeatherFromCache(city);

        if (cached) {
            const time = formatCacheItem(cached.timestamp);

            const badgeText = cached.isStale
                ? `old (${time})`
                : `cached from ${time}`;

            temperatureElement.innerHTML =
                `${cached.data.name}: ${cached.data.temperature} °C ` +
                `<span class="cache-badge">(${badgeText})</span>`;

            temperatureElement.classList.add('cached');

        } else {
            temperatureElement.textContent =
                `Error: ${error.message}`;
        }
    }
}


async function initWeather() {
    const cityInput = document.getElementById('city');
    const city = cityInput.value.trim();

    if (!city) {
        return;
    }

    const cached = getWeatherFromCache(city);

    if (!cached || typeof cached.data?.temperature !== 'number') {
        return;
    }

    const temperatureElement =
        document.getElementById('temperature');

    const time = formatCacheItem(cached.timestamp);

    temperatureElement.innerHTML =
        `${cached.data.name}: ${cached.data.temperature} °C ` +
        `<span class="cache-badge">` +
        `(${cached.isStale ? 'old' : `cached from ${time}`})` +
        `</span>`;

    temperatureElement.classList.add('cached');
}

function updateNetworkStatus() {
    const networkStatus = document.getElementById('networkStatus');

    if (!networkStatus) { return; }
    if (navigator.onLine) {
        networkStatus.textContent = 'Online';
        networkStatus.classList.remove('offline');
        networkStatus.classList.add('online');
    } else {
        networkStatus.textContent = 'Offline';
        networkStatus.classList.remove('online');
        networkStatus.classList.add('offline')
    }
}
async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response;
        } catch (err) {
            if (err.name === 'AbortError') {
                throw err;
            }

            lastError = err;
            if (i === retries - 1) {
                break;
            }

            delay = delay * 2;
            console.warn(`Try ${i + 1} not success. Try new ${delay} ms...`);

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}

window.addEventListener('online', async () => {
    updateNetworkStatus();

    const city = document
        .getElementById('city')
        .value
        .trim();

    if (city) {
        await loadWeather();
    }
});

window.addEventListener('offline', () => {
    updateNetworkStatus();
});

document
    .getElementById('searchBtn')
    .addEventListener('click', loadWeather);

const savedCity = localStorage.getItem('lastCity');

if (savedCity) {
    document.getElementById('city').value = savedCity;
}
updateNetworkStatus();
initWeather();