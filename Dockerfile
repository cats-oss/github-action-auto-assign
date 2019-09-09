FROM node:12.10.0-alpine

LABEL "com.github.actions.name"="auto_assign"
LABEL "com.github.actions.description"="Auto assign by your comment like highfive or popuko"

ADD src/ /app/src/
ADD package.json /app/package.json
ADD yarn.lock /app/yarn.lock

WORKDIR /app
RUN ["yarn", "--production"]

ENTRYPOINT ["node", "/app/src/index.js"]
