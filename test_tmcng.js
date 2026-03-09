const https = require('https');
https.get('https://tmcng.net/', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        let matches = data.match(/src="([^"]+)"/g);
        if (matches) {
            console.log(matches.filter(m => m.includes('.jpg') || m.includes('.png') || m.includes('.webp') || m.includes('.jpeg')));
        } else {
            console.log("No images found");
        }
    });
});
