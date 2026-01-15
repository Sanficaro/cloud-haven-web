const https = require('https');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local because 'dotenv' might not be installed
let HF_TOKEN = process.env.HF_TOKEN;
try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf8');
        const match = envConfig.match(/HF_TOKEN=(.*)/);
        if (match) {
            HF_TOKEN = match[1].trim();
        }
    }
} catch (e) {
    console.error("Error reading .env.local:", e);
}

const MODELS = [
    "gpt2", // Tiny text model (Control)
    "runwayml/stable-diffusion-v1-5", // SD 1.5 (Standard old)
    "CompVis/stable-diffusion-v1-4", // SD 1.4 (Ancient)
    "stabilityai/sdxl-turbo", // Re-test
];

async function checkModel(modelId) {
    return new Promise((resolve) => {
        const data = JSON.stringify({ inputs: "test image" });
        const options = {
            hostname: 'api-inference.huggingface.co',
            path: `/models/${modelId}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = https.request(options, (res) => {
            console.log(`[${res.statusCode}] ${modelId}`);
            if (res.statusCode === 200) {
                resolve({ id: modelId, status: 'OK' });
            } else {
                // Drain response to clear buffer
                res.on('data', () => { });
                resolve({ id: modelId, status: res.statusCode });
            }
        });

        req.on('error', (e) => {
            console.error(`[ERR] ${modelId}: ${e.message}`);
            resolve({ id: modelId, status: 'ERR' });
        });

        req.write(data);
        req.end();
    });
}

async function run() {
    console.log("Testing Models with Token ending in..." + (HF_TOKEN ? HF_TOKEN.slice(-4) : 'NONE'));
    for (const model of MODELS) {
        await checkModel(model);
    }
}

run();
