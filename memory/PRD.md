# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha de Actualización: 2025-01-17
### Version: 1.4

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
| **Administrador** | Gestión de usuarios, reportes globales, filtros avanzados |
| **Gerente Regional** | Autoriza créditos/desembolsos, ve cartera regional, cierra caja regional |
| **Supervisor** | Autoriza créditos/desembolsos, registra pagos, cierra caja regional, edita asesores |
| **Asesor de Crédito** | Alta clientes, registra pagos, solicita desembolsos, cierra su caja |

---

## Funcionalidades Implementadas

### ✅ Autenticación y Usuarios
- Login con usuario/contraseña (JWT)
- Roles RBAC con permisos estrictos
- Gestión de usuarios (editar/eliminar/contraseña)
- Filtros por región y rol

### ✅ Gestión de Clientes
- Alta de clientes con datos completos
- Evidencias obligatorias (fotos)
- Coordenadas GPS
- **Filtros avanzados por localidad y asesor**

### ✅ Gestión de Créditos
- Tipos: Diario (L-V), Semanal, Catorcenal
- Cálculo automático de calendario de pagos
- Flujo de autorización
- **Filtros avanzados por localidad y asesor**

### ✅ Sistema de Cobranza (MEJORADO)
- **5 tarjetas resumen**: Hoy, Atrasados, Por Vencer (Diarios, Semanales, Catorcenales)
- **Secciones separadas por tipo de crédito**
- **Botón "Mapa"** para acceso a Google Maps con coordenadas del cliente
- Teléfono del cliente visible
- Badge de tipo de crédito
- Flujo "NO PAGO" con evidencia

### ✅ Caja Regional del Supervisor
- **Estado de Cierres del Día**: Progreso visual de cierres de asesores
- **Tarjetas por asesor**: ✓ verde (cerrado) / ○ naranja (pendiente)
- **Resumen por Localidad**: Totales por zona
- **Cobros por Asesor**: Acordeón expandible con detalle de pagos
- **Flujo de cierre jerárquico**
- **Filtros** por localidad y asesor

### ✅ Dashboard de Supervisor en Tiempo Real
- **Tarjeta "Rendimiento del Día"** con badge "EN VIVO"
- **Alertas de Cobranza** con enlaces directos
- **Desembolsos Pendientes** de aprobación
- **Rendimiento de Asesores**: Ranking con medallas
- **Auto-actualización cada 30 segundos**

### ✅ Programación de Desembolsos (NUEVO v1.4)
- **Solicitud de desembolso**: Asesor o Supervisor crean solicitud
- **Evidencia fotográfica de tarjeta del cliente** al solicitar
- **Evidencia fotográfica obligatoria** al ejecutar desembolso
- **Renovaciones**: Cliente debe liquidar crédito anterior
- **Flujo de aprobación**: Solicitar → Aprobar/Rechazar → Ejecutar

### ✅ Sistema de Notificaciones (NUEVO v1.4)
- **Botón de Notificaciones** en sidebar
- **Dropdown con lista de notificaciones**
- **Contador de no leídas** en badge
- **Marcar como leída** individual o todas
- **Polling automático** cada 30 segundos
- **Notificaciones automáticas** cuando un asesor cierra caja

### ✅ Asignación Automática por Región (NUEVO v1.4)
- **Botón "Asignación Automática"** en página de Asignaciones
- Asigna automáticamente asesores sin supervisor al supervisor de su misma región
- Visible solo cuando hay asesores pendientes de asignar
- Diálogo de confirmación antes de ejecutar

### ✅ Asignaciones
- Asignación de supervisores a regiones
- Asignación de asesores a supervisores
- Vista jerárquica
- Sección de asesores sin supervisor

### ✅ Auditoría
- Log de todas las acciones
- Filtros por entidad y usuario

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
- Botones grandes para móviles
- Colores semáforo: Verde=Vigente, Amarillo=Atrasado, Rojo=Vencido

---

## Backlog Pendiente

### P1 (Próximas)
- Reportes exportables (PDF/Excel)
- Integración de mapas embebidos (Leaflet)

### P2 (Futuro)
- Notificaciones WhatsApp
- Firma digital
- Score interno de clientes
- Generación de tickets de pago

---

## Endpoints API Principales

### Desembolsos
- `POST /api/disbursements` - Crear solicitud
- `GET /api/disbursements` - Listar solicitudes
- `GET /api/disbursements/pending` - Pendientes de aprobación
- `GET /api/disbursements/scheduled` - Programados (próximos 7 días)
- `POST /api/disbursements/{id}/approve` - Aprobar
- `POST /api/disbursements/{id}/reject` - Rechazar
- `POST /api/disbursements/{id}/execute` - Ejecutar y crear crédito

### Notificaciones (NUEVO)
- `GET /api/notifications` - Obtener notificaciones del usuario
- `GET /api/notifications/unread-count` - Contador de no leídas
- `POST /api/notifications/{id}/read` - Marcar como leída
- `POST /api/notifications/read-all` - Marcar todas como leídas

### Usuarios
- `GET /api/users/unassigned-asesores` - Asesores sin supervisor
- `POST /api/users/auto-assign-region` - Asignación automática

### Caja
- `GET /api/cashbox/asesores-status` - Estado de cierres de asesores
- `POST /api/cashbox/close-regional` - Cerrar caja regional

### Dashboard
- `GET /api/stats/supervisor-dashboard` - Dashboard en tiempo real

### Archivos
- `POST /api/upload` - Subir archivos (imágenes)

---

## Credenciales de Prueba
- `developer` / `developer123`
- `admin` / `admin123`
- `gerente_yajalon` / `gerente123`
- `supervisor_yajalon` / `supervisor123`

---

## Changelog
- **v1.4 (2025-01-17)**:
  - Evidencia fotográfica en desembolsos (tarjeta al solicitar, evidencia obligatoria al ejecutar)
  - Sistema de notificaciones con UI en sidebar
  - Asignación automática de asesores por región
  - Corrección de rutas duplicadas en backend
- **v1.3 (2025-01-16)**:
  - Cobranza: Secciones separadas por tipo, botón de mapa, 5 tarjetas resumen
  - Caja Regional: Estado de cierres, cierre jerárquico, filtros
  - Dashboard Supervisor: Métricas en tiempo real, rendimiento asesores
  - Desembolsos Programados: Flujo completo de solicitud/aprobación/ejecución
- **v1.2 (2025-01-16)**: Supervisores registran pagos, gestión de usuarios mejorada, filtros avanzados
- **v1.1 (2025-01-15)**: Página de Asignaciones
- **v1.0 (2025-01-14)**: MVP inicial
