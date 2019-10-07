FROM node:12.11.0-alpine

ADD src/ /app/src/
ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock

WORKDIR /app
RUN ["yarn", "--production"]

ENTRYPOINT ["node", "/app/src/index.js"]
