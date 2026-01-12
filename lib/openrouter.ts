export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export const MODELS = {
    alfred: "google/gemini-2.0-flash-001",
    agent_smith: "meta-llama/llama-3.3-70b-instruct",
    blind_date: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
    research: "openai/gpt-4o-mini-search-preview",
    legacy_research: "perplexity/sonar"
};

export type ChatMessage = {
    role: "user" | "assistant" | "system";
    content: string;
};

export type ChatRequest = {
    messages: ChatMessage[];
    mode: "alfred" | "agent_smith" | "blind_date";
};
