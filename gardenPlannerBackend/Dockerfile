FROM python:3.10-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files
COPY . .

# Run static files collection
RUN python manage.py collectstatic --noinput

# Expose port
EXPOSE 8000