# Troubleshooting Guide

## Common Issues

---

## Docker Issues

### Containers Keep Restarting

```bash
# Check logs
docker logs <service-name>

# Common causes:
# - Database not ready (wait for postgres healthcheck)
# - Missing environment variable
# - Port conflict
```

### Cannot Connect to PostgreSQL from IDE

1. Verify port mapping:
   ```bash
   docker port postgres
   # Should show: 5432/tcp -> 0.0.0.0:5544
   ```

2. Verify dev profile is active:
   ```bash
   docker logs brand-sv | grep "profiles"
   ```

3. Test connectivity:
   ```bash
   psql -h localhost -p 5544 -U erphub -l
   ```

### RabbitMQ UI Not Accessible

1. Verify container: `docker ps | grep rabbitmq`
2. Check port mapping: `docker port rabbitmq`
3. Visit http://localhost:15672 (guest/guest)

---

## Backend Issues

### Service Won't Start

1. Check PostgreSQL is running:
   ```bash
   docker ps | grep postgres
   ```

2. Check profile:
   ```bash
   mvn spring-boot:run -Dspring-boot.run.arguments='--spring.profiles.active=dev'
   ```

3. Check logs:
   ```bash
   mvn spring-boot:run 2>&1 | tail -50
   ```

### Compilation Errors

```bash
# Clean and rebuild
mvn clean
mvn compile
```

### Missing Dependencies

```bash
# Update dependencies
mvn dependency:resolve
```

---

## Frontend Issues

### Angular Won't Start

```bash
# Install dependencies
cd frontend/web-client
rm -rf node_modules
npm install

# Start dev server
npm start
```

### Build Errors

```bash
# Clear cache
rm -rf .angular
npm run build
```

### TypeScript Errors

```bash
# Check tsconfig.json
# Verify Node.js version (needs 20+)
node --version
```

---

## Service Communication

### Feign Client Connection Failed

1. Check Eureka registration:
   ```bash
   curl http://localhost:8761/eureka/apps
   ```

2. Check circuit breaker:
   ```bash
   docker logs brand-sv | grep CircuitBreaker
   ```

3. Verify service name matches:
   ```@FeignClient(name = "supplier-sv")```

### Gateway 404 Errors

1. Check route configuration in `application.yaml`
2. Verify service is registered in Eureka
3. Check logs: `docker logs gateway-sv`

---

## Database Issues

### Connection Refused

1. Verify PostgreSQL is running
2. Check credentials in `.env`
3. Verify port (5544 for dev, 5432 for prod)

### Schema Not Created

```bash
# Run init scripts manually
docker exec -it postgres psql -U erphub -f /docker/postgres/init/01-create-databases.sql
```

---

## Performance Issues

### Slow Startup

- First start: 2-3 minutes (13 databases + services)
- Subsequent: ~30 seconds
- Check: `docker stats`

### High Memory Usage

- Adjust JVM heap: `JAVA_OPTS=-Xmx512m`
- Adjust RabbitMQ memory in compose file

---

## Getting Help

1. Check service logs
2. Verify configuration (dev vs prod profile)
3. Check Docker network connectivity
4. Review [documentation](local-development.md)