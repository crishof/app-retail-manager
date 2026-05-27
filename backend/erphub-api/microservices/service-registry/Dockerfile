# =========================================================
# Stage 1: Build
# =========================================================
FROM eclipse-temurin:25-jdk-noble AS build
WORKDIR /app

COPY service-registry/.mvn/ .mvn/
COPY service-registry/mvnw mvnw
COPY pom.xml pom.xml

# Crear directorios vacíos con pom.xml para cada módulo
COPY api-gateway/pom.xml api-gateway/pom.xml
COPY branch-sv/pom.xml branch-sv/pom.xml
COPY brand-sv/pom.xml brand-sv/pom.xml
COPY cash-sv/pom.xml cash-sv/pom.xml
COPY category-sv/pom.xml category-sv/pom.xml
COPY config-server/pom.xml config-server/pom.xml
COPY customer-sv/pom.xml customer-sv/pom.xml
COPY exchange-sv/pom.xml exchange-sv/pom.xml
COPY identity-sv/pom.xml identity-sv/pom.xml
COPY image-sv/pom.xml image-sv/pom.xml
COPY inventory-sv/pom.xml inventory-sv/pom.xml
COPY location-sv/pom.xml location-sv/pom.xml
COPY pricing-sv/pom.xml pricing-sv/pom.xml
COPY product-sv/pom.xml product-sv/pom.xml
COPY purchase-sv/pom.xml purchase-sv/pom.xml
COPY reporting-sv/pom.xml reporting-sv/pom.xml
COPY sales-sv/pom.xml sales-sv/pom.xml
COPY service-registry/pom.xml service-registry/pom.xml
COPY supplier-catalog-sv/pom.xml supplier-catalog-sv/pom.xml
COPY supplier-sv/pom.xml supplier-sv/pom.xml
COPY tenant-sv/pom.xml tenant-sv/pom.xml
COPY retail-api/pom.xml retail-api/pom.xml

RUN chmod +x mvnw && ./mvnw -N install -q

RUN ./mvnw -pl service-registry -am dependency:go-offline -q

COPY service-registry/src service-registry/src

RUN ./mvnw -pl service-registry -am package -DskipTests -q && \
    echo "=== JARs ===" && \
    ls -la /app/service-registry/target/*.jar

# =========================================================
# Stage 2: Runtime
# =========================================================
FROM eclipse-temurin:25-jre-noble
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/service-registry/target/service-registry-*.jar app.jar
EXPOSE 8761
ENTRYPOINT ["java", "-jar", "app.jar"]