self.addEventListener('install', function(event) {
    event.waitUntil(async () => {
        var cache = await caches.open('v1')
        return cache.addAll([
            '/sw-test/',
            '/sw-test/index.html',
            '/sw-test/style.css',
            '/sw-test/app.js',
            '/sw-test/image-list.js',
            '/sw-test/star-wars-logo.jpg',
            '/sw-test/gallery/bountyHunters.jpg',
            '/sw-test/gallery/myLittleVader.jpg',
            '/sw-test/gallery/snowTroopers.jpg'
        ]);
        
    })
})
  



self.addEventListener('fetch', function(event) {
    event.respondWith(async () => {
        var response = await caches.match(event.request)
        if (response !== undefined) {
            return response;
        } else {
            try {
                var response = await fetch(event.request)
                var cache = await caches.open('v1')

                cache.put(event.request, response.clone());

                return response;
            } catch (e) {
                return caches.match('/sw-test/gallery/myLittleVader.jpg');
            }                
        }
    })
})