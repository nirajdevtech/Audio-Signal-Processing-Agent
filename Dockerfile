FROM python:3.13-slim

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY requirements.txt requirements-nodeps.txt ./

# Step 1 — install ibm-watsonx-ai without its metadata constraints so pip
# does not reject pandas 2.2.3 (ibm-watsonx-ai declares pandas<2.2.0 but
# is fully runtime-compatible with 2.2.x).
RUN pip install --no-cache-dir --no-deps -r requirements-nodeps.txt

# Step 2 — install everything else normally; resolver no longer sees the
# ibm-watsonx-ai pandas<2.2.0 conflict.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Make the entrypoint executable
RUN chmod +x start.sh

EXPOSE 8080

# start.sh expands $PORT in /bin/sh before exec-ing gunicorn, so the
# port is always resolved regardless of how the platform invokes this image.
CMD ["/app/start.sh"]
