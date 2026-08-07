# =========================================================
# Stage 1: Build
# (contexto de build: microservices/ - incluye parent pom.xml)
# =========================================================
FROM eclipse-temurin:25-jdk-noble AS build
WORKDIR /app

# Copiar el wrapper Maven y el parent POM
COPY retail-api/.mvn/ .mvn/
COPY retail-api/mvnw mvnw
COPY pom.xml pom.xml

# Instalar el parent POM en el repositorio local de Maven
RUN chmod +x mvnw && ./mvnw -N install -q

# Cachear dependencias del servicio (capa separada del src)
COPY retail-api/pom.xml retail-api/pom.xml
RUN ./mvnw -f retail-api/pom.xml dependency:go-offline -q

# Compilar el servicio (maven.test.skip: no compila ni ejecuta los tests)
COPY retail-api/src retail-api/src
RUN ./mvnw -f retail-api/pom.xml package -Dmaven.test.skip=true -q

# =========================================================
# Stage 2: Runtime (imagen JRE - mas liviana)
# =========================================================
FROM eclipse-temurin:25-jre-noble
RUN apt-get update && apt-get install -y wget && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/retail-api/target/*.jar app.jar
# Puerto por defecto del servicio (prod usa ${PORT:9020}; Railway inyecta $PORT).
EXPOSE 9020
ENTRYPOINT ["java", "-jar", "app.jar"]
