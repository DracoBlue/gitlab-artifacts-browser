FROM node:12.9.0-alpine

RUN mkdir -p /usr/src/app && chown node:node /usr/src/app
USER node

ARG APP_VERSION
WORKDIR /usr/src/app

ENV APP_VERSION $APP_VERSION
ADD ./index.js /usr/src/app/
ADD ./package.json /usr/src/app/
ADD ./package-lock.json /usr/src/app/
RUN npm install
CMD ["node", "./index"]
