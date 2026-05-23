FROM node:20-alpine

RUN npm install -g pnpm@9

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

RUN chmod +x start-api.sh

EXPOSE 8080

CMD ["sh", "start-api.sh"]
