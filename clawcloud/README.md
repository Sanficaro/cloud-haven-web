# Non-Censored AI on ClawCloud Run

This directory contains the setup to run `DeepSeek-R1-Distill-Llama-8B-Uncensored` on ClawCloud Run's free tier.

## How it Works
1.  **Tiny Image**: The Docker image is small (~200MB) because it *doesn't* contain the model.
2.  **Auto-Download**: When the cloud server starts, `entrypoint.sh` downloads the 4.7GB model from HuggingFace.
3.  **Persistency**: If you attach a Storage Volume, it will save the model there so it doesn't download every time.

## Deployment Steps

1.  **Push to GitHub**: Ensure this `clawcloud` folder is in your GitHub repository.
2.  **Go to ClawCloud Console**: Create a new "Run" service.
3.  **Source**: Select "GitHub" and choose your repository.
4.  **Build Settings**:
    *   **Dockerfile Path**: `clawcloud/Dockerfile`
    *   **Context Directory**: `clawcloud` (OR root, but pointing to the Dockerfile is key)
5.  **Resources**:
    *   Select **Free Plan** (4 vCPU, 8GB RAM).
    *   **Port**: 8080.
6.  **Deploy**: Click "Deploy".
    *   *First run will take ~2-5 minutes* to download the model before the API becomes responsive.

## API Usage
Once running, you will get a URL (e.g., `https://my-ai-app.claw.run`).
Your API Endpoint for OpenAI-compatible clients:
`https://my-ai-app.claw.run/v1`
