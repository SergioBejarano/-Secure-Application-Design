# 🏛️ Secure Application Design — PropertyManager

---

## 🎥 Video

Click here:

<p align="center">
  <a href="https://youtu.be/wx2WXRo1kC8">
    <img src="https://img.youtube.com/vi/wx2WXRo1kC8/hqdefault.jpg" 
         alt="Property Manager: Functionality" width="700">
  </a>
</p>

### Apache (Frontend)

On the Apache server, a VirtualHost is configured to serve the frontend over HTTPS:

```apache
<VirtualHost *:443>
  ServerName sergioarep.duckdns.org
  SSLEngine on
  SSLCertificateFile /etc/letsencrypt/live/sergioarep.duckdns.org/fullchain.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/sergioarep.duckdns.org/privkey.pem
  DocumentRoot /var/www/html
</VirtualHost>
```

### Spring Boot (Backend) behind NGINX

On the backend server, NGINX is configured as a reverse proxy to securely expose the Spring Boot application over HTTPS. The configuration is located at `/etc/nginx/conf.d/spring.conf`.

```nginx
server {
    listen 443 ssl;
    server_name sergioarep-spring.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/sergioarep-spring.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sergioarep-spring.duckdns.org/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:42000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name sergioarep-spring.duckdns.org;
    return 301 https://$host$request_uri;
}
```

After updating the configuration, always test and reload NGINX:

```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 1. Application Architecture

![Sin título (7)](https://github.com/user-attachments/assets/00bbd45d-de8c-4b66-b5d5-786e4e1eff69)

- **Frontend:** HTML/CSS/JS served by Apache HTTP Server with TLS at `https://sergioarep.duckdns.org`.
- **Backend:** Spring Boot 3 (Java 17) deployed on EC2 (Amazon Linux 2023) as a Docker container, securely accessible via HTTPS at `https://sergioarep-spring.duckdns.org`.
- **Database:** MySQL 8 running in a Docker container on the EC2 instance.

**Relationship between Apache, Spring, and the asynchronous HTML+JS client:**

- The HTML+JS client consumes the Spring Boot backend REST API securely via HTTPS.
- Apache serves the frontend and can redirect `/api` to the secure backend if required.

---

## 2. Secure Deployment on AWS

- **EC2 Instance:** Amazon Linux 2023.
- **NGINX:** Reverse proxy for the backend, terminates TLS.
- **Certbot (Let's Encrypt):** Automatic generation and renewal of SSL certificates.
- **Security Groups:** Only ports 80 (HTTP, for Certbot) and 443 (HTTPS) are open to the public.

## 3. Security Implementation

- **Authentication:** HTTP Basic Auth, only authenticated users can access `/api/properties/**`.
- **Passwords:** Hashed with BCrypt, never stored in plain text.
- **Stateless:** No session is stored on the server.
- **CSRF:** Disabled (no session cookies used).
- **CORS:** Only allows requests from the secure frontend.
- **Admin user:** Automatically created with a hashed password.

**Security configuration snippet** (`src/main/java/co/edu/escuelaing/propertymanager/config/SecurityConfig.java`):

```java
http
    .csrf(csrf -> csrf.disable())
    .cors(cors -> cors.configurationSource(corsConfigurationSource()))
    .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(authz -> authz
        .requestMatchers("/api/properties/**").authenticated()
        .anyRequest().permitAll())
    .httpBasic(httpBasic -> {});
```

---

## 4. SSL Certificates (Let's Encrypt)

### Backend (Spring Boot + NGINX)

- Certificate generated with Certbot and configured in NGINX.
- Location: `/etc/letsencrypt/live/sergioarep-spring.duckdns.org/`

### Frontend (Apache)

- Certificate generated with Certbot and configured in Apache.
- Location: `/etc/letsencrypt/live/sergioarep.duckdns.org/`

**Command to generate certificate:**

```bash
sudo certbot --nginx -d sergioarep-spring.duckdns.org
sudo certbot --apache -d sergioarep.duckdns.org --redirect
```

<img width="1493" height="529" alt="Captura de pantalla 2025-10-01 154151" src="https://github.com/user-attachments/assets/11a6e731-d162-483e-be69-94f3bb3bc79a" />

## SSL Certificates

On Apache server:

<img width="1578" height="276" alt="image" src="https://github.com/user-attachments/assets/db139d3b-9087-43f9-8f6c-fb07e66dc06a" />

On Spring server:

<img width="1817" height="231" alt="image" src="https://github.com/user-attachments/assets/dc5f7fe7-cbd2-4c28-b811-30c283f51bb5" />

---

## 5. CORS Configuration

Only the secure frontend origin is allowed:

**CORS configuration** (`src/main/java/co/edu/escuelaing/propertymanager/config/SecurityConfig.java`):

```java
@Bean
public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList("https://sergioarep.duckdns.org"));
    configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(Arrays.asList("*"));
    configuration.setAllowCredentials(true);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
}
```

---

## 6. Secure Password Management

- Passwords are hashed with BCrypt.
- Admin user is automatically created when the application starts.

**Automatic admin user creation** (`src/main/java/co/edu/escuelaing/propertymanager/service/impl/UserServiceImpl.java`):

```java
if (!userExists("admin")) {
    User adminUser = new User();
    adminUser.setUsername("admin");
    adminUser.setPassword(passwordEncoder.encode("sergioadmin"));
    adminUser.setRole("ADMIN");
    adminUser.setEnabled(true);
    userRepository.save(adminUser);
}
```

---

## 7. Docker Containers and Security

- The backend runs as a **non-root user** in Docker, reducing privilege escalation risks.
- A lightweight and secure base image is used: `eclipse-temurin:17-jre-alpine`.
- Backend processes are **isolated** from the host operating system.
- Sensitive variables (credentials, ports) are managed via **environment variables** and never stored in source code.
- The container exposes only the necessary port (`8081`), minimizing the attack surface.

**Dockerfile snippet** (`Dockerfile`):

```dockerfile
FROM eclipse-temurin:17-jre-alpine
# Crear usuario no root para mayor seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 8081
CMD ["java", "-cp", "./classes:./dependency/*", "co.edu.escuelaing.propertymanager.PropertyManager"]
```

---

## 8. Local Testing

**Start containers:**

```bash
docker compose up -d
```

**Test API locally:**

```bash
curl -i -u admin:sergioadmin http://localhost:8081/api/properties
```

<img width="1717" height="543" alt="image" src="https://github.com/user-attachments/assets/9d2fe11b-fbca-445a-a3a3-1a5f5cfe222c" />

---

## Frontend Code (JS)

**Authentication and secure API consumption** (`src/main/resources/static/script.js`):

```js
const API_BASE = `https://sergioarep-spring.duckdns.org/api/properties`;
let authHeader = null;
function buildAuthHeader(user, pass) {
  return "Basic " + btoa(`${user}:${pass}`);
}
function requireAuthHeaders(json = false) {
  if (!authHeader) return json ? { "Content-Type": "application/json" } : {};
  return json
    ? { "Content-Type": "application/json", Authorization: authHeader }
    : { Authorization: authHeader };
}
```
