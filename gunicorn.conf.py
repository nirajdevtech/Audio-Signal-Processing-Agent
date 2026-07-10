"""
Gunicorn configuration file.
Reads PORT from the environment so no shell variable expansion is needed
in the Dockerfile CMD or Procfile — avoids '$PORT is not a valid port number'
errors on platforms that do not expand shell variables in exec-form commands.
"""
import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8080')}"
workers = 4
