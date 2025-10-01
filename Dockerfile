FROM openjdk:17

WORKDIR /usrapp/bin

ENV PORT 9000

COPY /target/classes /usrapp/bin/classes
COPY /target/dependency /usrapp/bin/dependency

CMD ["java","-cp","./classes:./dependency/*","co.edu.escuelaing.propertymanager.PropertyManager"]