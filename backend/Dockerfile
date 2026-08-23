# Use stable Debian bookworm to avoid trixie repository 403 Forbidden errors
FROM python:3.11-slim-bookworm

WORKDIR /app

# Removed apt-get update: opencv-python-headless does not require libgl1 or libglib2.0

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip uninstall -y opencv-python opencv-python-headless && \
    pip install --no-cache-dir opencv-python-headless

COPY . .

EXPOSE 8000

# The main.py uses uvicorn.run("main:app", host="0.0.0.0", port=8000)
CMD ["python", "main.py"]
