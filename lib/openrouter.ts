export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
    // CONFIRMED FREE IDS as of Jan 2026
    normal: "google/gemini-2.0-flash-exp:free",
    spice: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free"
};

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ChatRequest = {
    messages: ChatMessage[];
    mode: "normal" | "spice";
};
