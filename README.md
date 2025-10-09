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

## 1. Arquitectura de la Aplicación

- **Frontend:** HTML/CSS/JS servido por Apache HTTP Server con TLS en `https://sergioarep.duckdns.org`.

- **Backend:** Spring Boot 3 (Java 17) desplegado en EC2 (Amazon Linux 2023) como contenedor Docker, accesible de forma segura por HTTPS en `https://sergioarep-spring.duckdns.org`.
- **Base de datos:** MySQL 8 en contenedor Docker en instancia EC2.

**Relación entre Apache, Spring y el cliente HTML+JS asíncrono:**

- El cliente HTML+JS consume la API REST del backend Spring Boot de forma segura por HTTPS.
- Apache sirve el frontend y puede redirigir `/api` al backend seguro si se requiere.

---

## 2. Despliegue Seguro en AWS

- **Instancia EC2:** Amazon Linux 2023.
- **NGINX:** Proxy inverso para el backend, termina TLS.
- **Certbot (Let's Encrypt):** Generación y renovación automática de certificados SSL.
- **Security Groups:** Solo puertos 80 (HTTP, para Certbot) y 443 (HTTPS) abiertos al público.

## 3. Implementación de Seguridad

- **Autenticación:** HTTP Basic Auth, solo usuarios autenticados acceden a `/api/properties/**`.
- **Contraseñas:** Hasheadas con BCrypt, nunca en texto plano.
- **Stateless:** No se guarda sesión en el servidor.
- **CSRF:** Deshabilitado (no se usan cookies de sesión).
- **CORS:** Solo permite solicitudes desde el frontend seguro.
- **Usuario admin:** Se crea automáticamente con contraseña hasheada.

**Fragmento de configuración de seguridad** (`src/main/java/co/edu/escuelaing/propertymanager/config/SecurityConfig.java`):

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

## 4. Certificados SSL (Let's Encrypt)

### Backend (Spring Boot + NGINX)

- Certificado generado con Certbot y configurado en NGINX.
- Ubicación: `/etc/letsencrypt/live/sergioarep-spring.duckdns.org/`

### Frontend (Apache)

- Certificado generado con Certbot y configurado en Apache.
- Ubicación: `/etc/letsencrypt/live/sergioarep.duckdns.org/`

**Comando para generar certificado:**

```bash
sudo certbot --nginx -d sergioarep-spring.duckdns.org
sudo certbot --apache -d sergioarep.duckdns.org --redirect
```

---

## 5. Configuración de CORS

Solo se permite el origen seguro del frontend:

**Configuración de CORS** (`src/main/java/co/edu/escuelaing/propertymanager/config/SecurityConfig.java`):

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

## 6. Gestión Segura de Contraseñas

- Contraseñas hasheadas con BCrypt.
- Usuario admin creado automáticamente al iniciar la aplicación.

**Creación automática del usuario admin** (`src/main/java/co/edu/escuelaing/propertymanager/service/impl/UserServiceImpl.java`):

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

## 7. Contenedores Docker y Seguridad

- El backend corre como **usuario no root** en Docker, lo que reduce el riesgo de escalamiento de privilegios.
- Se utiliza una imagen base ligera y segura: `eclipse-temurin:17-jre-alpine`.
- Los procesos del backend están **aislados** del sistema operativo anfitrión.
- Las variables sensibles (credenciales, puertos) se gestionan mediante **variables de entorno** y nunca se almacenan en el código fuente.
- El contenedor expone solo el puerto necesario (`8081`), minimizando la superficie de ataque.

**Fragmento Dockerfile** (`Dockerfile`):

```dockerfile
FROM eclipse-temurin:17-jre-alpine
# Crear usuario no root para mayor seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
EXPOSE 8081
CMD ["java", "-cp", "./classes:./dependency/*", "co.edu.escuelaing.propertymanager.PropertyManager"]
```

---

## 8. Pruebas Locales

**Levantar contenedores:**

```bash
docker compose up -d
```

**Probar API local:**

```bash
curl -i -u admin:sergioadmin http://localhost:8081/api/properties
```

---

## Código Frontend (JS)

**Autenticación y consumo seguro de la API** (`src/main/resources/static/script.js`):

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
