# React Build
FROM node:18 as frontend-builder

WORKDIR /frontend
COPY streamlit_flow/frontend/ ./
RUN npm ci && npm run build

# Python Build
FROM python:3.13.5-slim

# Install deps
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- create non-root user ----
RUN useradd -m -u 1000 user
WORKDIR /app

# Install Python deps
COPY --chown=user requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code with correct ownership
COPY --chown=user src/ ./src/
COPY --chown=user streamlit_flow/ ./streamlit_flow/
COPY --from=frontend-builder /frontend/build ./streamlit_flow/frontend/build

# Expose streamlit port
EXPOSE 8501

# Healthcheck
HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health || exit 1

# Switch to non-root user
USER user

# Streamlit config folder biar ga nulis ke root
ENV STREAMLIT_HOME=/home/user/.streamlit
RUN mkdir -p $STREAMLIT_HOME

ENV PYTHONPATH=/app

ENTRYPOINT ["streamlit", "run", "/app/src/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
