export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
    // Verified free models from the "Amazing" state
    normal: "google/gemini-2.0-flash-exp",
    spice: "meta-llama/llama-3.3-70b-instruct"
};

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ChatRequest = {
    messages: ChatMessage[];
    mode: "normal" | "spice";
};
