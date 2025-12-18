FROM node:lts

WORKDIR /app

# Copy only package files first (cache-friendly)
COPY package*.json ./

# Install dependencies INSIDE container
RUN npm install

# Copy the rest of the source
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
