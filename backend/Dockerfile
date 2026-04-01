# Stage 1: Build ứng dụng dùng container Maven
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml và tải dependencies về trước để tận dụng cache Docker
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy mã nguồn thực tế và Build
COPY src ./src
RUN mvn clean package -Dmaven.test.skip=true -B

# Stage 2: Môi trường chạy thực tế (Nhẹ hơn)
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy file JAR đã được build từ Stage 1 sang đây
COPY --from=builder /app/target/*.jar app.jar

# Định nghĩa đường dẫn lưu trữ file/ảnh cục bộ bên trong Container
RUN mkdir -p /app/uploads
VOLUME /app/uploads

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
