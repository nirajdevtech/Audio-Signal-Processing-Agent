FROM python:3.13-slim

WORKDIR /app

# Copy dependency manifests first (better layer caching)
COPY requirements.txt requirements-nodeps.txt ./

# Step 1 — install packages whose published metadata has overly-restrictive
# bounds without letting pip evaluate those bounds.
RUN pip install --no-cache-dir --no-deps -r requirements-nodeps.txt

# Step 2 — install everything else; pandas>=2.2.2 resolves cleanly now
# because the conflicting ibm-watsonx-ai metadata was already bypassed.
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source
COPY . .

# Make the entrypoint executable
RUN chmod +x start.sh

EXPOSE 8080

# start.sh expands $PORT in /bin/sh before exec-ing gunicorn, so the
# port is always resolved regardless of how the platform invokes this image.
CMD ["/app/start.sh"]
