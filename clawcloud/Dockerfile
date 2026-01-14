# Base image: Ubuntu 22.04 (Small and compatible)
FROM ubuntu:22.04

# Prevent interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies (curl/wget for download, libgomp1 for OpenMP)
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Download pre-built llama-server binary (saves build time & size)
# Using latest release from ggerganov/llama.cpp (approximate URL, adjusting to specific release is safer)
# For now, we'll download a known compatible static build or build from source if needed.
# Building from source is safer for compatibility but slower. Let's try downloading a binary first.
# actually, let's build it to be safe (it takes ~5 mins but ensures it works on the VPS CPU).
RUN apt-get update && apt-get install -y build-essential cmake

RUN git clone https://github.com/ggerganov/llama.cpp.git \
    && cd llama.cpp \
    && cmake -B build -DGGML_NATIVE=OFF \
    && cmake --build build --config Release -j 4 \
    && cp build/bin/llama-server /app/llama-server \
    && cd .. \
    && rm -rf llama.cpp

# Copy the entrypoint script
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Expose the API port
EXPOSE 8080

# Start!
ENTRYPOINT ["/app/entrypoint.sh"]
