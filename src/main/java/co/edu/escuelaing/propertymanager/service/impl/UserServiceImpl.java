package co.edu.escuelaing.propertymanager.service.impl;

import co.edu.escuelaing.propertymanager.model.User;
import co.edu.escuelaing.propertymanager.repository.UserRepository;
import co.edu.escuelaing.propertymanager.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public Optional<User> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public boolean userExists(String username) {
        return userRepository.existsByUsername(username);
    }

    @Override
    public void createDefaultAdminUser() {
        if (!userExists("admin")) {
            User adminUser = new User();
            adminUser.setUsername("admin");
            adminUser.setPassword(passwordEncoder.encode("sergioadmin"));
            adminUser.setRole("ADMIN");
            adminUser.setEnabled(true);
            userRepository.save(adminUser);
            System.out.println("Usuario admin creado con contraseña: sergioadmin");
        }
    }

    @EventListener(ApplicationReadyEvent.class)
    public void init() {
        createDefaultAdminUser();
    }
}