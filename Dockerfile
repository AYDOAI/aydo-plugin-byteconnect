FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN apt update

RUN npm install -g nodemon

RUN npm install

