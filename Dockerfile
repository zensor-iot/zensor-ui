FROM node:20-alpine AS builder
WORKDIR /app
ENV VITE_API_BASE_URL=https://server.zensor-iot.net
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build



FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 
