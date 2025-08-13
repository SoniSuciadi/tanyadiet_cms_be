FROM node:22-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache imagemagick graphicsmagick ghostscript
COPY package*.json ./
RUN npm install --omit=dev

COPY . .  

EXPOSE 8080

CMD ["node", "dist/main"]