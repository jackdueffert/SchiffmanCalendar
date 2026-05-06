FROM node:22-slim

# Build tools needed for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

WORKDIR /app

# Install server dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Copy server code and prompt
COPY server/ ./server/
COPY prompt.md .

# Persistent volume mount points
RUN mkdir -p /data /app/uploads

EXPOSE 3001

CMD ["node", "server/index.js"]
