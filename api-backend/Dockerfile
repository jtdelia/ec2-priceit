FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy dependency files first for better caching
COPY pyproject.toml .
RUN uv pip install --system -e .

# Copy the rest of the application
COPY . .

EXPOSE 8080

# Set default port
ENV PORT=8080

# Use uvicorn to run the FastAPI application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT