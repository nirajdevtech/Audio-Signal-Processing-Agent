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

EXPOSE 8080

# Exec form (no shell) — port is resolved by gunicorn.conf.py in Python,
# which reads os.environ['PORT'] directly. This avoids shell expansion
# issues on platforms that inject $PORT without a shell intermediary.
CMD ["gunicorn", "--config", "gunicorn.conf.py", "app:app"]
