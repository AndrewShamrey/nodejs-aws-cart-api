### STAGE 1: Build ###
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --quiet
COPY . .
RUN npm run build

### STAGE 2: Run ###
FROM node:18-alpine
WORKDIR /app
COPY --from=0 /app/dist ./dist
ENV PORT=4000
EXPOSE 4000
CMD [ "node", "dist/main" ]
