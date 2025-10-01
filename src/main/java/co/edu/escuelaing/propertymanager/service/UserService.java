package co.edu.escuelaing.propertymanager.service;

import co.edu.escuelaing.propertymanager.model.User;

import java.util.Optional;

public interface UserService {
    Optional<User> findByUsername(String username);

    void createDefaultAdminUser();

    boolean userExists(String username);
}