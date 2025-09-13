# Use Maven to build the project
FROM maven:3.9.6-eclipse-temurin-17 AS builder
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Use lightweight JDK image for runtime
FROM eclipse-temurin:17-jdk

# Install required native libraries for OpenCV (highgui, x11, gtk, ffmpeg, etc.)
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libcanberra-gtk-module \
    libx11-6 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
