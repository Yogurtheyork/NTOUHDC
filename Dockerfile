FROM ghcr.io/puppeteer/puppeteer:23.11.1

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable \
    ACCOUNT=01257059    \
    PASSWORD=Y4o8r1k8   \
    PHONE=0917310240\
    EMAIL=york4818@gmail.com

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "node", "bin/server.js" ]