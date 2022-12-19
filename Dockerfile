FROM node:16.19.0-buster-slim

ADD src/ /app/src/
ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock

WORKDIR /app
RUN ["yarn", "--production"]

ENTRYPOINT ["node", "/app/src/index.mjs"]
