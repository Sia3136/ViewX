FROM python:3.11-slim

WORKDIR /app

# Install curl, libgl1 (Mesa OpenGL), and libglib2.0 for OpenCV
RUN apt-get update && apt-get install -y curl libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt && \
    pip uninstall -y opencv-python opencv-python-headless && \
    pip install --no-cache-dir opencv-python-headless

COPY . .

EXPOSE 8000

# The main.py uses uvicorn.run("main:app", host="0.0.0.0", port=8000)
CMD ["python", "main.py"]
