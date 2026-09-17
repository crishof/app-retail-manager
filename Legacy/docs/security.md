# Security Guidelines

## Public Repository

This is a **public repository**. Follow these rules to avoid exposing secrets.

---

## Never Commit

- `.env` files with real credentials
- API keys, tokens, passwords
- Database connection strings with passwords
- Private certificates/keys
- AWS/GCP/Azure credentials

---

## Environment Variables

Use `.env` files locally (add to `.gitignore`):

```bash
# Template only - DO NOT use real values
POSTGRES_USER=your_user
POSTGRES_PASSWORD=your_password
RABBITMQ_PASSWORD=your_password
JWT_SECRET=your_secret_key
```

Reference in code:
```properties
spring.datasource.url=${DB_URL}
spring.rabbitmq.password=${RABBITMQ_PASSWORD}
```

---

## .gitignore

The project includes comprehensive `.gitignore` that excludes:
- `.env`, `*.env`
- `secrets/`, `*.key`, `*.pem`
- Build artifacts
- IDE files

---

## Configuration Files

### Config Server

Store only non-sensitive config in YAML:
```yaml
spring:
  datasource:
    url: jdbc:postgresql://postgres:5432/brand_db
    # password comes from environment variable
```

### Application YAML

```yaml
spring:
  config:
    import: optional:configserver:http://config-server:8888

  datasource:
    password: ${DB_PASSWORD}  # From environment
```

---

## Example .env.example

Safe to commit (no real credentials):

```bash
# PostgreSQL
POSTGRES_USER=erphub
POSTGRES_PORT=5544

# RabbitMQ
RABBITMQ_PORT=5672
RABBITMQ_MANAGEMENT_PORT=15672

# Spring
SPRING_PROFILES_ACTIVE=dev
```

---

## Production Recommendations

1. **Secrets Management**: Use HashiCorp Vault, AWS Secrets Manager, or similar
2. **Network**: Run services in isolated network
3. **TLS**: Enable HTTPS for all external endpoints
4. **Authentication**: Implement JWT/OAuth2 before production
5. **Monitoring**: Set up security audit logging

---

## Reporting Security Issues

If you discover a security vulnerability, please report it privately.

---

## References

- [GitHub Secrets Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)