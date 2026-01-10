# Cloud Haven (Web App)

This is the official "Tailored Shirt" web application for Haven.AI.
It is built with Next.js, Tailwind CSS, and connects to OpenRouter.

## 🚀 How to Deploy (The Ease Way)

### Step 1: Push to GitHub
1.  Create a new repository on GitHub (e.g., `haven-cloud`).
2.  Upload these files to it.

### Step 2: Deploy to Vercel
1.  Go to [Vercel.com](https://vercel.com) and log in.
2.  Click **"Add New..."** -> **"Project"**.
3.  Import your `haven-cloud` repository.
4.  **IMPORTANT:** In the "Environment Variables" section, add:
    *   Key: `OPENROUTER_API_KEY`
    *   Value: `sk-or-v1-......` (Your OpenRouter Key)
5.  Click **Deploy**.

## 🧠 Brain Configuration
The app automatically switches between:
- **Normal Mode:** Gemini 1.5 Flash (via OpenRouter)
- **Spice Mode:** Venice Uncensored (via OpenRouter)

## 🎨 Customizing
- **Colors:** Edit `tailwind.config.js`
- **Logic:** Edit `lib/openrouter.ts`
- **UI:** Edit `components/ChatInterface.tsx`
