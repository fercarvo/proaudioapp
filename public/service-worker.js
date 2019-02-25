/**
 * Service worker para ITSC
 * 
 * 15/10/2018
 * Edgar Carvajal efcu03@gmail.com
 * 
 * Este SW servira para incrementar el performance y reducir el trafico de los aplicativos usados en ITSC
 */

const CACHE_NAME = 'Static-PROAUDIO-APP-v1.5'

self.addEventListener('install', function (event) {
    event.waitUntil(async function() {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(['/js/app.js'])
    }())
})

self.addEventListener('activate', function(event) {

    event.waitUntil(async function () {
        var cacheNames = await caches.keys() //Todos los cache
        var toRemove = cacheNames.filter(c => c !== CACHE_NAME) //Se filtra todos los diferentes a CACHE_NAME
        console.log('[SW] Removiendo caches', toRemove)

        return await Promise.all(toRemove.map(c => caches.delete(c)))
    }())    
})

self.addEventListener('fetch', function(event) {
    const not_cache = [
        '/login',
        '/logout'
    ]

    if ( not_cache.some(dir => RegExp(dir).test( event.request.url)) ) //Si alguno es igual al url del request, se ignora el fetchevent
        return;

    if (RegExp('/views/').test( event.request.url ))
        return event.respondWith( cacheThenNetworkUpdate(event) );

    if (RegExp('/app.js').test( event.request.url ))
        return event.respondWith( cacheThenNetworkUpdate(event) );

    const destination = event.request.destination;

    switch (destination) {
        case 'style':
        case 'script':
        case 'image':
        case 'font': {
            event.respondWith( alwaysCache(event) )
            return;
        }
        default: {
            event.respondWith( networkThenCache(event) )  
            return;
        }
    }
})

async function cacheThenNetworkUpdate(event) {
    var cache = await caches.open(CACHE_NAME)
    var cacheResponse = await cache.match(event.request, {ignoreSearch: false})
    var requestToCache = event.request.clone()

    var fetchPromise = fetch(event.request).then(networkResponse => {
        
        //Si hay respuesta, pero no es 200 ok, se retorna y no se cachea
        if (networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }

        let responseToCache = networkResponse.clone()
        cache.put(requestToCache, responseToCache)
        console.log('[SW] Guardado en cache', event.request.url)

        return networkResponse;
    })

    return cacheResponse || fetchPromise
}

async function alwaysCache (event) {
    var response = await caches.match(event.request, {ignoreSearch: true, cacheName: CACHE_NAME})

    return response || fetch(event.request).then(networkResponse => {
        
        //Si hay respuesta, pero no es 200 ok, se retorna y no se cachea
        if (networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }
        
        let responseToCache = networkResponse.clone()
        caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache)
            console.log('[SW] Guardado en cache', event.request.url)
        })

        return networkResponse;
    })
}

async function networkThenCache(event) {
    var requestToCache = event.request.clone()
    try {
        var response = await fetch(event.request)

        //Si hay respuesta, pero no es 200 ok, se retorna y no se cachea
        if (response.status !== 200 || response.type !== 'basic') {
            return response;
        }

        var responseToCache = response.clone();

        caches.open(CACHE_NAME).then(cache => {
            cache.put(requestToCache, responseToCache)
            console.log('[SW] Guardado en cache', event.request.url)
        })

        return response

    } catch (error) {
        var response_cache = await caches.match(event.request, {cacheName: CACHE_NAME})
        return response_cache
    }
}