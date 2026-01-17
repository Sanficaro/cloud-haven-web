const fs = require('fs');
const https = require('https');
const path = require('path');

const ASSETS = [
    {
        name: 'door_locked.png',
        prompt: 'Photorealistic massive gothic mansion double door, dark wood, heavy gold handles, cinematic lighting, night, eyes wide shut aesthetic',
        width: 1024,
        height: 1024
    },
    {
        name: 'venetian_hall_bg.png',
        prompt: 'Cinematic wide shot of a venetian masquerade ball, red velvet curtains, gold pillars, dim candlelight, stanley kubrick style, wide angle, blur',
        width: 1920,
        height: 1080
    },
    {
        name: 'venetian_mask_gold.png',
        prompt: 'Ornate gold venetian full face mask, mysterious, cinematic lighting, isolated on black background',
        width: 512,
        height: 512
    }
];

const DOWNLOAD_DIR = path.join(__dirname, 'public/media/design');

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${filepath}`);
                    resolve();
                });
            } else {
                reject(`Failed to download ${url}: Status ${res.statusCode}`);
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => { }); // Delete failed file
            reject(err.message);
        });
    });
};

async function main() {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
        fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
    }

    console.log("Starting Asset Generation...");

    for (const asset of ASSETS) {
        // Updated URL to correct endpoint
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(asset.prompt)}?width=${asset.width}&height=${asset.height}&nologo=true`;
        const filepath = path.join(DOWNLOAD_DIR, asset.name);

        try {
            await downloadImage(url, filepath);
        } catch (e) {
            console.error(`Error downloading ${asset.name}:`, e);
        }
    }
    console.log("All Assets Generated.");
}

main();
