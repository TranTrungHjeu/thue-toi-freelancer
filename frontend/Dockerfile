FROM node:20-alpine
WORKDIR /app

# Copy các mô tả package
COPY package*.json ./

# Cài đặt tất cả thư viện (có thể dùng npm ci nếu có package-lock)
RUN npm install

# Copy toàn bộ mã nguồn Frontend
COPY . .

# Expose port mặc định của Next.js
EXPOSE 3000

# Chạy dev server
CMD ["npm", "run", "dev"]
