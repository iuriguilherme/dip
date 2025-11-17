FROM n8nio/n8n:1.120.2

USER root

# Install dependencies required for custom nodes
RUN npm install -g typeorm@0.3.17 pg@8.11.3

USER node

# Copy package.json for community nodes
COPY --chown=node:node package.json /home/node/.n8n/nodes/package.json

# Install community nodes
RUN cd /home/node/.n8n/nodes && npm install
