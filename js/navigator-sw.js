if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('SW зарегистрирован'))
        .catch(err => console.log('Ошибка SW', err));
}