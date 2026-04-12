# === Kisaan AI - Development Dockerfile ===
# For local development with hot reload
# For production deployment, use Dockerfile.production instead

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci --legacy-peer-deps
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts ./
COPY src/ ./src/
COPY public/ ./public/
RUN npm run build

# Stage 2: Python Backend
FROM python:3.11-slim
WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libffi-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY main.py config.py models.py auth.py fcm_service.py advisory_agent.py mandi_agent.py start.py ./
COPY ml/ ./ml/
COPY orchestrator/ ./orchestrator/
COPY tools/ ./tools/
COPY data/ ./data/
COPY specs/ ./specs/
COPY scripts/ ./scripts/

# Copy built frontend from Stage 1
COPY --from=frontend-build /app/dist ./dist

# Create upload dirs
RUN mkdir -p uploads/audio chroma_db

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')" || exit 1

# Development mode with reload
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
