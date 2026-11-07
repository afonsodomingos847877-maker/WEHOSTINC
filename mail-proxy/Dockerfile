FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY proxy.js ./
RUN mkdir -p certs
EXPOSE 3000 993 465
CMD ["node", "proxy.js"]
