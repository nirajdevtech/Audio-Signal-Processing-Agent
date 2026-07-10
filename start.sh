#!/bin/sh
# Resolve $PORT at container start time and pass it explicitly to gunicorn.
# This works regardless of whether the platform uses shell-form CMD, exec-form
# CMD, or reads the Procfile — $PORT is expanded here in sh before gunicorn
# ever sees it.
exec gunicorn --workers 4 --bind "0.0.0.0:${PORT:-8080}" app:app
