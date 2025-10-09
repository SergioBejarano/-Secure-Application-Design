// Base de la API absoluta al backend HTTPS
const API_BASE = `https://sergioarep-spring.duckdns.org/api/properties`;

let authHeader = null; 

function buildAuthHeader(user, pass) {
    return 'Basic ' + btoa(`${user}:${pass}`);
}

function requireAuthHeaders(json = false) {
    if (!authHeader) return json ? { 'Content-Type': 'application/json' } : {};
    return json
        ? { 'Content-Type': 'application/json', 'Authorization': authHeader }
        : { 'Authorization': authHeader };
}

document.addEventListener('DOMContentLoaded', function() {
    initializeLogin();
});

function initializeLogin() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = document.getElementById('loginUser').value.trim();
            const pass = document.getElementById('loginPass').value;
            authHeader = buildAuthHeader(user, pass);
            const ok = await pingAuth();
            if (ok) {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('app-container').style.display = '';
                initializeApp();
            } else {
                showLoginMessage('Credenciales inválidas. Intenta nuevamente.', 'error');
            }
        });
    }
}

async function pingAuth() {
    try {
        const resp = await fetch(API_BASE, { headers: requireAuthHeaders(false) });
        return resp.status !== 401; // si no es 401, considerarlo válido
    } catch (e) {
        return false;
    }
}

function showLoginMessage(msg, type) {
    const el = document.getElementById('loginResponse');
    if (!el) return;
    el.textContent = msg;
    el.className = `response ${type}`;
    el.style.display = 'block';
}

function initializeApp() {
    document.getElementById('createForm').addEventListener('submit', createProperty);
    document.getElementById('updateForm').addEventListener('submit', updateProperty);
    document.getElementById('searchBtn').addEventListener('click', searchProperty);
    document.getElementById('refreshBtn').addEventListener('click', loadProperties);
    
    loadProperties();
}

async function createProperty(e) {
    e.preventDefault();
    
    const property = {
        address: document.getElementById('address').value.trim(),
        price: parseFloat(document.getElementById('price').value),
        size: parseFloat(document.getElementById('size').value),
        description: document.getElementById('description').value.trim()
    };

    if (!property.address || !property.price || !property.size) {
        showResponse('createResponse', 'Complete todos los campos obligatorios', 'error');
        return;
    }

    try {
        const response = await fetch(API_BASE, {
            method: 'POST',
            headers: requireAuthHeaders(true),
            body: JSON.stringify(property)
        });

        if (response.ok) {
            const result = await response.json();
            showResponse('createResponse', `Propiedad creada con ID: ${result.id}`, 'success');
            document.getElementById('createForm').reset();
            loadProperties();
        } else {
            showResponse('createResponse', 'Error al crear la propiedad', 'error');
        }
    } catch (error) {
        showResponse('createResponse', 'Error de conexión', 'error');
    }
}

async function searchProperty() {
    const id = document.getElementById('searchId').value.trim();
    
    if (!id) {
        showResponse('searchResponse', 'Ingrese un ID válido', 'error');
        return;
    }

    try {
    const response = await fetch(`${API_BASE}/${id}`, { headers: requireAuthHeaders(false) });
        
        if (response.ok) {
            const property = await response.json();
            const info = `ID: ${property.id}\nDirección: ${property.address}\nPrecio: $${property.price.toLocaleString()}\nTamaño: ${property.size} m²\nDescripción: ${property.description || 'Sin descripción'}`;
            showResponse('searchResponse', info, 'success');
        } else {
            showResponse('searchResponse', 'Propiedad no encontrada', 'error');
        }
    } catch (error) {
        showResponse('searchResponse', 'Error de conexión', 'error');
    }
}

async function loadProperties() {
    const container = document.getElementById('propertiesList');
    container.innerHTML = '<div class="loading">Cargando...</div>';

    try {
    const response = await fetch(API_BASE, { headers: requireAuthHeaders(false) });
        
        if (response.ok) {
            const properties = await response.json();
            renderProperties(properties);
        } else {
            container.innerHTML = '<div class="empty-state">Error al cargar propiedades</div>';
        }
    } catch (error) {
        container.innerHTML = '<div class="empty-state">Error de conexión</div>';
    }
}

function renderProperties(properties) {
    const container = document.getElementById('propertiesList');
    
    if (properties.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay propiedades registradas</div>';
        return;
    }

    container.innerHTML = properties.map(property => `
        <div class="property-card">
            <div class="property-header">
                <span class="property-id">ID: ${property.id}</span>
            </div>
            <div class="property-details">
                <strong>Dirección:</strong> ${property.address}<br>
                <strong>Precio:</strong> $${property.price.toLocaleString()}<br>
                <strong>Tamaño:</strong> ${property.size} m²<br>
                <strong>Descripción:</strong> ${property.description || 'Sin descripción'}
            </div>
            <div class="property-actions">
                <button class="btn btn-warning btn-small" onclick="fillUpdateForm(${property.id}, '${property.address.replace(/'/g, "\\'")}', ${property.price}, ${property.size}, '${(property.description || '').replace(/'/g, "\\'")}')">
                    Editar
                </button>
                <button class="btn btn-danger btn-small" onclick="deleteProperty(${property.id})">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
}

function fillUpdateForm(id, address, price, size, description) {
    document.getElementById('updateId').value = id;
    document.getElementById('updateAddress').value = address;
    document.getElementById('updatePrice').value = price;
    document.getElementById('updateSize').value = size;
    document.getElementById('updateDescription').value = description;
}

async function updateProperty(e) {
    e.preventDefault();
    
    const id = document.getElementById('updateId').value;
    const property = {
        address: document.getElementById('updateAddress').value.trim(),
        price: parseFloat(document.getElementById('updatePrice').value),
        size: parseFloat(document.getElementById('updateSize').value),
        description: document.getElementById('updateDescription').value.trim()
    };

    if (!property.address || !property.price || !property.size) {
        showResponse('updateResponse', 'Complete todos los campos obligatorios', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/${id}`, {
            method: 'PUT',
            headers: requireAuthHeaders(true),
            body: JSON.stringify(property)
        });

        if (response.ok) {
            showResponse('updateResponse', 'Propiedad actualizada correctamente', 'success');
            document.getElementById('updateForm').reset();
            loadProperties();
        } else {
            showResponse('updateResponse', 'Error al actualizar', 'error');
        }
    } catch (error) {
        showResponse('updateResponse', 'Error de conexión', 'error');
    }
}

async function deleteProperty(id) {
    if (!confirm('¿Eliminar esta propiedad?')) return;

    try {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE', headers: requireAuthHeaders(false) });

        if (response.ok) {
            loadProperties();
        } else {
            alert('Error al eliminar');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

function showResponse(elementId, message, type) {
    const responseDiv = document.getElementById(elementId);
    responseDiv.className = `response ${type}`;
    responseDiv.textContent = message;
    responseDiv.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => responseDiv.style.display = 'none', 3000);
    }
}