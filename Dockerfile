FROM node:alpine

COPY . .

RUN yarn install
RUN yarn build

CMD ["node", "dist/index"]