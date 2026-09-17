# =========================================================
# Stage 1: Build
# Build context = this project dir (backend/retail-api). Standalone monolith,
# no parent POM. On Railway set the service Root Directory to backend/retail-api.
# =========================================================
FROM eclipse-temurin:25-jdk-noble AS build
WORKDIR /app

# Maven wrapper + POM first (dependency layer cached separately from src)
COPY .mvn/ .mvn/
COPY mvnw mvnw
COPY pom.xml pom.xml
RUN chmod +x mvnw && ./mvnw dependency:go-offline -q

# Compile & package (maven.test.skip: do not compile or run tests in the image)
COPY src src
RUN ./mvnw package -Dmaven.test.skip=true -q

# =========================================================
# Stage 2: Runtime (JRE)
# =========================================================
FROM eclipse-temurin:25-jre-noble
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# Default service port (prod uses ${PORT:9020}; Railway injects $PORT).
EXPOSE 9020
ENTRYPOINT ["java", "-jar", "app.jar"]
