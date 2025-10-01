package co.edu.escuelaing.propertymanager;

import java.util.Collections;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 *
 * @author sergio.bejarano-r
 */
@SpringBootApplication
public class PropertyManager {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(PropertyManager.class);
        app.setDefaultProperties(Collections.singletonMap("server.port", getPort()));
        app.run(args);
    }

    private static int getPort() {
        if (System.getenv("PORT") != null) {
            return Integer.parseInt(System.getenv("PORT"));
        }
        return 9000;
    }
}
