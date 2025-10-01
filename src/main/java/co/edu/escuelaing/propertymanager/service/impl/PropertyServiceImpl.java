package co.edu.escuelaing.propertymanager.service.impl;

import co.edu.escuelaing.propertymanager.model.Property;
import co.edu.escuelaing.propertymanager.repository.PropertyRepository;
import co.edu.escuelaing.propertymanager.service.PropertyService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;

    @Autowired
    public PropertyServiceImpl(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @Override
    public Property createProperty(Property property) {
        return propertyRepository.save(property);
    }

    @Override
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }

    @Override
    public Optional<Property> getPropertyById(Long id) {
        if (id == null || id <= 0) {
            return Optional.empty();
        }
        return propertyRepository.findById(id);
    }

    @Override
    public Property updateProperty(Long id, Property property) {
        Optional<Property> optional = propertyRepository.findById(id);
        if (optional.isPresent()) {
            Property existing = optional.get();
            existing.setAddress(property.getAddress());
            existing.setPrice(property.getPrice());
            existing.setSize(property.getSize());
            existing.setDescription(property.getDescription());
            return propertyRepository.save(existing);
        }
        throw new RuntimeException("Property not found with id: " + id);
    }

    @Override
    public void deleteProperty(Long id) {
        propertyRepository.deleteById(id);
    }

}
