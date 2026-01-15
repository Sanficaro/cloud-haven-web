const https = require('https');

const URL = "https://image.pollinations.ai/prompt/test_image_generation?nologo=true&width=512&height=512";

async function checkPollinations() {
    return new Promise((resolve) => {
        https.get(URL, (res) => {
            console.log(`[${res.statusCode}] Pollinations.ai`);
            if (res.statusCode === 200 || res.statusCode === 302) {
                resolve(true);
            } else {
                resolve(false);
            }
        }).on('error', (e) => {
            console.error(`[ERR] Pollinations: ${e.message}`);
            resolve(false);
        });
    });
}

checkPollinations();
