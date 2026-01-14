#!/bin/bash

MODEL_URL="https://huggingface.co/bartowski/DeepSeek-R1-Distill-Llama-8B-Uncensored-GGUF/resolve/main/DeepSeek-R1-Distill-Llama-8B-Uncensored-Q4_K_M.gguf"
MODEL_FILE="DeepSeek-R1-Distill-Llama-8B-Uncensored.Q4_K_M.gguf"

echo "Checking for model file: $MODEL_FILE..."

if [ -f "$MODEL_FILE" ]; then
    echo "Model exists."
else
    echo "Model not found. Downloading from HuggingFace..."
    echo "URL: $MODEL_URL"
    wget -O "$MODEL_FILE" "$MODEL_URL"
    echo "Download complete."
fi

echo "Starting llama-server..."
# --host 0.0.0.0 is crucial for docker networking
exec ./llama-server --model "$MODEL_FILE" --host 0.0.0.0 --port 8080 --ctx-size 4096 --n-gpu-layers 0
