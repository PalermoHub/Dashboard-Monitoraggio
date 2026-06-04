// logger.js — silenzia console.log/warn in produzione
// Per attivare il debug: localStorage.setItem('DEBUG','true') e ricarica
(function () {
    'use strict';
    const isDebug =
        location.hostname === 'localhost'  ||
        location.hostname === '127.0.0.1' ||
        localStorage.getItem('DEBUG') === 'true';
    if (!isDebug) {
        const noop = function () {};
        console.log  = noop;
        console.warn = noop;
        // console.error rimane attivo per errori reali
    }
})();
