export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
    // Top-tier paid models to utilize credits and bypass free-tier 429s
    normal: "meta-llama/llama-3.3-70b-instruct",
    spice: "meta-llama/llama-3.3-70b-instruct",
    research: "openai/gpt-4o-mini-search-preview",
    legacy_research: "perplexity/sonar"
};

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ChatRequest = {
    messages: ChatMessage[];
    mode: "normal" | "spice";
};
