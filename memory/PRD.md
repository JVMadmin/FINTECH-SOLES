# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha de Actualización: 2025-01-16
### Version: 1.2

---

## Problema Original
Sistema financiero integral para SOLES CORPORATIVO – CRÉDITOS. Sistema de administración del ciclo completo del crédito: captura de clientes, gestión de créditos, asignación de cartera, cobranza diaria, control de estatus, cierre de caja, alertas automáticas.

---

## Estructura de Región

### Región 3 - Yajalón (Sede Regional)
| Tipo | Localidad |
|------|-----------|
| **Sede** | Yajalón |
| Comunidad | Chilón |
| Comunidad | Bachajón |
| Comunidad | Tila |
| Comunidad | Tumbalá |
| Comunidad | Petalcingo |
| Comunidad | Temo |

---

## Usuarios y Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **Desarrollador** | Acceso total al sistema, configuración, logs |
| **Administrador** | Gestión de usuarios (editar/eliminar/contraseña), reportes globales, filtros avanzados |
| **Gerente Regional** | Autoriza créditos, ve cartera regional, asigna supervisores, edita usuarios de su región |
| **Supervisor** | Asigna cartera a asesores, autoriza créditos, **registra pagos**, edita asesores de su equipo |
| **Asesor de Crédito** | Alta clientes, **registra pagos**, ve su caja personal |

---

## Funcionalidades Implementadas

### ✅ Autenticación y Usuarios
- Login con usuario/contraseña (JWT)
- Roles RBAC con permisos estrictos
- **Gestión de usuarios mejorada:**
  - Admin/Gerente/Supervisor pueden editar usuarios de su ámbito
  - Cambio de contraseña por administradores
  - Activar/desactivar usuarios
- Usuarios de prueba: developer/developer123, admin/admin123, gerente_yajalon/gerente123, supervisor_yajalon/supervisor123

### ✅ Gestión de Clientes
- Alta de clientes con datos básicos
- Referencias personales (nombre, teléfono, relación)
- Evidencias obligatorias (fotos cliente/domicilio/negocio)
- Coordenadas GPS para domicilio y negocio
- **Filtros avanzados por localidad y asesor**
- Estatus: Vigente, Atrasado, Vencido

### ✅ Gestión de Créditos
- Tipos: Diario (L-V), Semanal, Catorcenal
- Cálculo automático de calendario de pagos
- Flujo de autorización: Pendiente → Autorizado → Vigente
- Supervisores y Gerentes pueden autorizar/rechazar
- **Filtros avanzados por localidad y asesor** (Admin/Gerente)

### ✅ Sistema de Cobranza
- Alertas automáticas por estatus
- Pagos del día, atrasados, próximos a vencer
- **Asesores Y Supervisores pueden registrar pagos**
- Métodos: efectivo, transferencia, depósito
- Flujo "NO PAGO" completo con evidencia

### ✅ Asignación de Cartera
- Solo supervisores pueden asignar clientes
- Selección múltiple de clientes
- Limitado a región del supervisor

### ✅ Página de Asignaciones
- Asignación de supervisores a regiones (Admin/Gerente)
- Asignación de asesores a supervisores
- Vista de supervisores por región con estado
- Vista de asesores agrupados por supervisor

### ✅ Caja y Cierre
- **Caja Personal (Asesor)**: Solo pagos registrados por el asesor
- **Caja Regional (Supervisor)**: Consolidación de pagos de sus asesores
- Cierre de caja con notas
- Historial de cierres

### ✅ Auditoría
- Log de todas las acciones del sistema
- Filtros por entidad y usuario
- Trazabilidad completa

---

## Stack Tecnológico
- **Backend**: FastAPI + Python
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Base de datos**: MongoDB
- **Autenticación**: JWT

---

## Diseño UI/UX
- Tema "Tactical Gold" - Dorado corporativo
- Fondo gris anti-reflejo para uso en campo
- Botones grandes (mínimo 48px) para móviles
- Colores semáforo: Verde=Vigente, Amarillo=Atrasado, Rojo=Vencido
- Diseño responsive con bottom navigation para móvil

---

## Backlog Pendiente

### P1 (Próximas)
- Evidencia fotográfica obligatoria al desembolsar crédito
- Reportes exportables (PDF/Excel)

### P2 (Futuro)
- Integración de mapas (Google Maps/Leaflet)
- Notificaciones por WhatsApp
- Firma digital de contratos
- Tickets de pago impresos
- Score interno de clientes

---

## Archivos Clave
- `/app/backend/server.py` - Backend monolito FastAPI
- `/app/frontend/src/pages/UsersPage.js` - Gestión de usuarios con edición/contraseña
- `/app/frontend/src/pages/CreditsPage.js` - Créditos con filtros avanzados
- `/app/frontend/src/pages/ClientsPage.js` - Clientes con filtros avanzados
- `/app/frontend/src/pages/CobranzaPage.js` - Cobranza y flujo NO PAGO
- `/app/frontend/src/pages/CashboxPage.js` - Caja personal/regional

---

## Credenciales de Prueba
- `developer` / `developer123`
- `admin` / `admin123`
- `gerente_yajalon` / `gerente123`
- `supervisor_yajalon` / `supervisor123`

---

## Changelog
- **v1.2 (2025-01-16):** 
  - Supervisores pueden registrar pagos
  - Admin/Gerente/Supervisor pueden editar/desactivar usuarios y cambiar contraseñas
  - Filtros avanzados por localidad y asesor en créditos y clientes
  - Corrección de estructura de localidades
- **v1.1 (2025-01-15):** Página de Asignaciones añadida al menú
- **v1.0 (2025-01-14):** MVP inicial con autenticación, clientes, créditos, cobranza
