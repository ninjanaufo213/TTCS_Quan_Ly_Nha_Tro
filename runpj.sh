#!/bin/bash

# Lấy đường dẫn tuyệt đối của thư mục chứa file script này
# Giúp bạn đứng ở đâu click cũng chạy đúng
PARENT_PATH=$(cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P)

echo "🚀 Đang khởi động Backend..."
cd "$PARENT_PATH/backend/api" && mvn spring-boot:run &

echo "🚀 Đang khởi động Frontend..."
cd "$PARENT_PATH/frontend" && npm start

