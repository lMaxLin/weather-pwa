const MAX_CACHE_AGE = 24 * 60 * 60 * 1000;
const CACHE_KEY_PREFIX = 'weather_';

function saveWeatherToCache(city, data) {
    try {
        const key = CACHE_KEY_PREFIX + city.toLowerCase();
        const payload = {
            data,
            timestamp: Date.now()
        }
        localStorage.setItem(key, JSON.stringify(payload));
    } catch (err) {
        console.error(
            'Error to save cache:', err
        );
    }
}

function getWeatherFromCache(city) {
    if (!city) {
        return null;
    }

    try {
        const key = CACHE_KEY_PREFIX + city.toLowerCase();
        const raw = localStorage.getItem(key);

        if (!raw) {
            return null
        }
        const cached = JSON.parse(raw);

        const age = Date.now() - cached.timestamp;

        const isStale =
            age > MAX_CACHE_AGE;

        return {
            data: cached.data,
            timestamp: cached.timestamp,
            isStale
        };

    } catch (err) {
        console.error(
            'Error read cache:',
            err
        );
        return null;
    }
}

function formatCacheItem(timestamp) {
    const date = new Date(timestamp);

    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}