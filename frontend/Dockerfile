FROM node:20-alpine
WORKDIR /app

# Copy các mô tả package
COPY package*.json ./

# Cài đặt tất cả thư viện (có thể dùng npm ci nếu có package-lock)
RUN npm install

# Copy toàn bộ mã nguồn Frontend
COPY . .

# Expose port mặc định của máy chủ Vite
EXPOSE 5173

# Chạy dev server và phát sóng mạng ra 0.0.0.0
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
