# Multi-stage build for SatyaCheck (Frontend + Python ML Backend)
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
# Build frontend static bundle
RUN npm run build

# Python backend stage
FROM python:3.11-slim
WORKDIR /app

# Install git-lfs and curl
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    git-lfs \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY server/requirements.txt ./server/requirements.txt
RUN pip install --no-cache-dir -r ./server/requirements.txt

# Copy server, models, and built frontend
COPY server/ ./server/
COPY model/ ./model/
COPY --from=frontend-builder /app/client/dist ./client/dist

# Set environment
ENV PORT=5000
ENV PYTHONUNBUFFERED=1

EXPOSE 5000

CMD ["gunicorn", "--chdir", "server", "run:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]
