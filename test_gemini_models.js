const { GoogleGenerativeAI } = require("@google/generative-ai");
// No dotenv require needed with --env-file

async function listModels() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error("No API Key found in environment!");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Expanded list of possibilities
    const modelsToTry = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-flash-001",
        "gemini-1.5-flash-002",
        "gemini-1.5-flash-8b",
        "gemini-2.0-flash-exp",
        "gemini-pro",
        "gemini-1.0-pro"
    ];

    console.log(`Testing Models with Key: ${apiKey.substring(0, 8)}...`);

    for (const modelName of modelsToTry) {
        process.stdout.write(`Testing: ${modelName.padEnd(25)} `);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hi");
            console.log(`✅ SUCCESS`);
        } catch (e) {
            const msg = e.message.split('\n')[0]; // First line only
            if (msg.includes("404")) console.log(`❌ 404 (Not Found)`);
            else if (msg.includes("400")) console.log(`❌ 400 (Bad Request)`);
            else if (msg.includes("403")) console.log(`❌ 403 (Permission)`);
            else console.log(`❌ FAILED: ${msg}`);
        }
    }
}

listModels();
