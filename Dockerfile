# ---------- build ----------
FROM node:22.17.0-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
WORKDIR /usr/src/app/apps/api
RUN npm run build

# ---------- runtime ----------
FROM node:22.17.0-alpine
WORKDIR /usr/src/app
ENV NODE_ENV=development
COPY --from=builder /usr/src/app/apps/api ./
RUN npm install --ignore-scripts
EXPOSE 3000
CMD ["npm", "run", "start:dev"]
