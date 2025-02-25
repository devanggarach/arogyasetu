FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .
ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

EXPOSE 3800

RUN npm run build
CMD ["npm", "run", "start"]
