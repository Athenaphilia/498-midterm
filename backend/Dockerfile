FROM node:lts

WORKDIR /app

# For development, so I can inspect the db directly
RUN apt-get update \
    && apt-get install -y sqlite3 \
    && rm -rf /var/lib/apt/lists/*

# Copy only package files first (cache-friendly)
COPY package*.json ./

# Install dependencies INSIDE container
RUN npm install

# Copy the rest of the source
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
