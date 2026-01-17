const fs = require('fs');
const https = require('https');
const path = require('path');

const ASSET = {
    name: 'venetian_mask_gold.png',
    prompt: 'Ornate gold venetian full face mask, mysterious, cinematic lighting, isolated on black background',
    width: 512,
    height: 512
};

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
            fs.unlink(filepath, () => { });
            reject(err.message);
        });
    });
};

async function main() {
    if (!fs.existsSync(DOWNLOAD_DIR)) fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(ASSET.prompt)}?width=${ASSET.width}&height=${ASSET.height}&nologo=true`;
    const filepath = path.join(DOWNLOAD_DIR, ASSET.name);

    try {
        await downloadImage(url, filepath);
        console.log("Mask Generated Successfully.");
    } catch (e) {
        console.error(`Error downloading mask:`, e);
    }
}

main();
