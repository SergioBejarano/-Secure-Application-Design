FROM eclipse-temurin:17-jre-alpine

WORKDIR /usrapp/bin

ENV PORT=8081

# Crear un usuario no root para mayor seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiar dependencias y clases compiladas
COPY /target/classes /usrapp/bin/classes
COPY /target/dependency /usrapp/bin/dependency

# Cambiar propietario de los archivos al usuario de la aplicación
RUN chown -R appuser:appgroup /usrapp/bin

# Cambiar al usuario no root
USER appuser

# Exponer el puerto
EXPOSE 8081

# Comando para ejecutar la aplicación
CMD ["java", "-cp", "./classes:./dependency/*", "co.edu.escuelaing.propertymanager.PropertyManager"]