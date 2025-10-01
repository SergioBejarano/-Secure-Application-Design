package co.edu.escuelaing.propertymanager.repository;

import co.edu.escuelaing.propertymanager.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {
}
