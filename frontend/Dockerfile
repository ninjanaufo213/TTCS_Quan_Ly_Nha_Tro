FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ARG REACT_APP_API_BASE_URL
ENV REACT_APP_API_BASE_URL=$REACT_APP_API_BASE_URL

RUN npm run build

FROM nginx:stable-alpine

# Copy file build từ stage trước vào thư mục chạy của Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# sao chép file cấu hình Nginx tùy chỉnh vào đè cấu hình mặc định
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]