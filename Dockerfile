FROM python:3.12-slim
WORKDIR /app
# Install dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
# Copy application code
COPY . .
# Create instance folder for SQLite
RUN mkdir -p instance
EXPOSE 5000
ENV FLASK_ENV=production
CMD ["python", "run.py"]
