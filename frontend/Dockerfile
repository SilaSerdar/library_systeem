FROM node:20-alpine AS base
WORKDIR /app

FROM base AS install
COPY package.json package-lock.json* ./
RUN npm install

FROM base AS dev
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
