FROM node:16.14.2-buster-slim

ADD src/ /app/src/
ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock

WORKDIR /app
RUN ["yarn", "--production"]

ENTRYPOINT ["node", "/app/src/index.mjs"]
