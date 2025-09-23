FROM node:20

# Working directory inside the container
WORKDIR /app

# Copy package files
COPY . .

# Install dependencies
RUN npm install


EXPOSE 5000

# Build TypeScript
RUN npm run build

# Crea l'utente root e avvia il backend
CMD ["sh", "-c", "npm run create-root && npm run start"]

