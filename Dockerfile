FROM n8nio/n8n:1.120.2

# Copy the JS entrypoint into the image
COPY entrypoint.js /usr/local/bin/entrypoint.js

# Ensure the entrypoint is executable
RUN chmod +x /usr/local/bin/entrypoint.js || true

USER root
RUN chown node:node /usr/local/bin/entrypoint.js || true
USER node

ENTRYPOINT ["node", "/usr/local/bin/entrypoint.js"]
# Dockerfile intentionally removed.
# The project uses the official image `n8nio/n8n:1.120.2` via `docker-compose.yml`.
# This file is left as a placeholder to avoid accidental local builds.
