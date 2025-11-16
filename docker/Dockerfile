FROM n8nio/n8n:1.120.2

USER node

# Copy package.json for community nodes
COPY --chown=node:node package.json /home/node/.n8n/nodes/package.json

# Install community nodes
RUN cd /home/node/.n8n/nodes && npm install
