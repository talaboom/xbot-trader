FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

ENV VITE_API_URL=https://backend-production-dd0c.up.railway.app/api/v1

RUN npm run build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g serve@13

COPY --from=build /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
