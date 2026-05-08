# Multi-stage Dockerfile for any Spring Boot service in /services/<name>.
#
# Build:
#   docker build -f infra/docker/java-service.Dockerfile \
#       --build-arg SERVICE=auth-service services/

ARG SERVICE=auth-service

# ── Stage 1: build ──
FROM eclipse-temurin:21-jdk-alpine AS build
ARG SERVICE
WORKDIR /workspace
COPY . .
RUN ./gradlew :${SERVICE}:bootJar --no-daemon --build-cache

# ── Stage 2: runtime ──
FROM eclipse-temurin:21-jre-alpine
ARG SERVICE
WORKDIR /app
RUN addgroup -S kaori && adduser -S kaori -G kaori
COPY --from=build /workspace/${SERVICE}/build/libs/*.jar /app/app.jar
USER kaori
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC"
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
