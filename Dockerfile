# React Build
FROM node:18 as frontend-builder

WORKDIR /frontend

COPY streamlit_flow/frontend/ ./

RUN npm ci && npm run build

# Python Build
FROM python:3.13.5-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    git \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ ./src/
COPY streamlit_flow/ ./streamlit_flow/

COPY --from=frontend-builder /frontend/build ./streamlit_flow/frontend/build

EXPOSE 8501

HEALTHCHECK CMD curl --fail http://localhost:8501/_stcore/health || exit 1

ENV PYTHONPATH=/app
ENTRYPOINT ["streamlit", "run", "/src/streamlit_app.py", "--server.port=8501", "--server.address=0.0.0.0"]
