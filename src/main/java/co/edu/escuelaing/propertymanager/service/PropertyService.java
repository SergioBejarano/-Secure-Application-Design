package co.edu.escuelaing.propertymanager.service;

import co.edu.escuelaing.propertymanager.model.Property;
import java.util.List;
import java.util.Optional;

public interface PropertyService {
    Property createProperty(Property property);

    List<Property> getAllProperties();

    Optional<Property> getPropertyById(Long id);

    Property updateProperty(Long id, Property property);

    void deleteProperty(Long id);

}
