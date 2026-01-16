# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha de Actualización: 2025-01-16
### Version: 1.3

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

### ✅ Caja Regional del Supervisor (NUEVO)
- **Estado de Cierres del Día**: Progreso visual de cierres de asesores
- **Tarjetas por asesor**: ✓ verde (cerrado) / ○ naranja (pendiente)
- **Resumen por Localidad**: Totales por zona
- **Cobros por Asesor**: Acordeón expandible con detalle de pagos
- **Flujo de cierre jerárquico**:
  1. Asesores cierran su caja individual
  2. Supervisor ve en tiempo real quién ha cerrado
  3. Botón "Cerrar Caja Regional" se habilita cuando TODOS cierran
- **Filtros** por localidad y asesor

### ✅ Dashboard de Supervisor en Tiempo Real (NUEVO)
- **Tarjeta "Rendimiento del Día"** con badge "EN VIVO"
  - Cobrado Hoy vs Esperado
  - Pagos Realizados vs Esperados
  - % de Cobro con barra de progreso
  - Pagos Atrasados
- **Alertas de Cobranza** con enlaces directos
- **Desembolsos Pendientes** de aprobación
- **Rendimiento de Asesores**: Ranking con medallas (oro, plata, bronce)
- **Auto-actualización cada 30 segundos**

### ✅ Programación de Desembolsos (NUEVO)
- **Solicitud de desembolso**: Asesor o Supervisor crean solicitud
- **Renovaciones**: Cliente debe liquidar crédito anterior
- **Selección de fecha de desembolso**
- **Flujo de aprobación**:
  1. Asesor solicita desembolso
  2. Supervisor/Gerente aprueba o rechaza
  3. Supervisor ejecuta desembolso (crea el crédito)
- **Tabs**: Pendientes | Programados | Todas
- **Dashboard**: Muestra desembolsos pendientes

### ✅ Asignaciones
- Asignación de supervisores a regiones
- Asignación de asesores a supervisores
- Vista jerárquica

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
- Evidencia fotográfica al desembolsar
- Reportes exportables (PDF/Excel)

### P2 (Futuro)
- Asignaciones mejoradas (auto-asignar por zona)
- Integración de mapas embebidos
- Notificaciones WhatsApp
- Firma digital
- Score interno de clientes

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

### Caja
- `GET /api/cashbox/asesores-status` - Estado de cierres de asesores
- `POST /api/cashbox/close-regional` - Cerrar caja regional

### Dashboard
- `GET /api/stats/supervisor-dashboard` - Dashboard en tiempo real

---

## Credenciales de Prueba
- `developer` / `developer123`
- `admin` / `admin123`
- `gerente_yajalon` / `gerente123`
- `supervisor_yajalon` / `supervisor123`

---

## Changelog
- **v1.3 (2025-01-16)**:
  - Cobranza: Secciones separadas por tipo, botón de mapa, 5 tarjetas resumen
  - Caja Regional: Estado de cierres, cierre jerárquico, filtros
  - Dashboard Supervisor: Métricas en tiempo real, rendimiento asesores
  - Desembolsos Programados: Flujo completo de solicitud/aprobación/ejecución
- **v1.2 (2025-01-16)**: Supervisores registran pagos, gestión de usuarios mejorada, filtros avanzados
- **v1.1 (2025-01-15)**: Página de Asignaciones
- **v1.0 (2025-01-14)**: MVP inicial
