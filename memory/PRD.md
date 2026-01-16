# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha de Actualización: 2025-01-15
### Version: 1.1

---

## Problema Original
Sistema financiero integral para SOLES CORPORATIVO – CRÉDITOS. Sistema de administración del ciclo completo del crédito: captura de clientes, gestión de créditos, asignación de cartera, cobranza diaria, control de estatus, cierre de caja, alertas automáticas.

---

## Usuarios y Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **Desarrollador** | Acceso total al sistema, configuración, logs |
| **Administrador** | Gestión de usuarios, reportes globales |
| **Gerente Regional** | Autoriza créditos, ve cartera regional, asigna supervisores |
| **Supervisor** | Asigna cartera a asesores, valida información, asigna asesores a su equipo |
| **Asesor de Crédito** | Alta clientes, registra pagos, ve su caja personal |

---

## Funcionalidades Implementadas

### ✅ Autenticación y Usuarios
- Login con usuario/contraseña (JWT)
- Roles RBAC con permisos estrictos
- Creación de usuarios limitada por región/rol
- Usuarios de prueba: developer/developer123, admin/admin123, gerente_yajalon/gerente123

### ✅ Gestión de Clientes
- Alta de clientes con datos básicos
- Referencias personales (nombre, teléfono, relación)
- Evidencias obligatorias (fotos cliente/domicilio/negocio)
- Coordenadas GPS para domicilio y negocio
- Filtros por región y estatus
- Estatus: Vigente, Atrasado, Vencido

### ✅ Gestión de Créditos
- Tipos: Diario (L-V), Semanal, Catorcenal
- Cálculo automático de calendario de pagos
- Flujo de autorización: Pendiente → Autorizado → Vigente
- Supervisores y Gerentes pueden autorizar/rechazar
- Requiere evidencias completas del cliente

### ✅ Sistema de Cobranza
- Alertas automáticas por estatus
- Pagos del día, atrasados, próximos a vencer
- Registro de pagos por asesor
- Métodos: efectivo, transferencia, depósito
- **Flujo "NO PAGO" completo**: 
  - Motivos: No pagó, No localizado, Promesa de pago, Otro
  - Fecha de promesa de pago
  - Carga de evidencia fotográfica
  - Confirmación antes de registrar

### ✅ Asignación de Cartera
- Solo supervisores pueden asignar clientes
- Selección múltiple de clientes
- Limitado a región del supervisor

### ✅ Página de Asignaciones (NUEVO)
- Asignación de supervisores a regiones (Admin/Gerente)
- Asignación de asesores a supervisores
- Vista de supervisores por región con estado
- Vista de asesores agrupados por supervisor
- Lista de asesores sin supervisor asignado

### ✅ Caja y Cierre
- **Caja Personal (Asesor)**: Solo pagos registrados por el asesor
- **Caja Regional (Supervisor)**: Consolidación de pagos de sus asesores
- Cierre de caja con notas
- Historial de cierres
- Total cobrado y pagos registrados

### ✅ Auditoría
- Log de todas las acciones del sistema
- Filtros por entidad y usuario
- Trazabilidad completa

### ✅ Estructura Jerárquica de Regiones
- Sede Regional: Yajalón (Región #3)
- Comunidades subordinadas: Chilón, Bachajón, Temo, Petalcingo, Tumbalá, Tila

---

## Stack Tecnológico
- **Backend**: FastAPI + Python
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Base de datos**: MongoDB
- **Autenticación**: JWT
- **Mapas**: OpenStreetMap (enlaces externos)
- **Almacenamiento**: Local (con ruta para migrar a cloud)

---

## Diseño UI/UX
- Tema "Tactical Gold" - Dorado corporativo
- Fondo gris anti-reflejo para uso en campo
- Botones grandes (mínimo 48px) para móviles
- Colores semáforo: Verde=Vigente, Amarillo=Atrasado, Rojo=Vencido
- Fuentes: Barlow Condensed (headings), Inter (body)
- Diseño responsive con bottom navigation para móvil

---

## Backlog Pendiente

### P1 (Próximas)
- Evidencia fotográfica obligatoria al desembolsar crédito
- Reportes exportables (PDF/Excel)
- Notificaciones push/email
- Firma digital de contratos
- Tickets de pago impresos

### P2 (Futuro)
- Integración de mapas (Google Maps/Leaflet) para visualizar clientes
- Integración WhatsApp automático
- Score interno de clientes
- App móvil nativa
- Geolocalización en tiempo real

---

## Archivos Clave
- `/app/backend/server.py` - Backend monolito FastAPI
- `/app/frontend/src/pages/AsignacionesPage.js` - Gestión de asignaciones
- `/app/frontend/src/pages/CobranzaPage.js` - Cobranza y flujo NO PAGO
- `/app/frontend/src/pages/CashboxPage.js` - Caja personal/regional
- `/app/frontend/src/components/layout/MainLayout.js` - Navegación principal

---

## Credenciales de Prueba
- `developer` / `developer123`
- `admin` / `admin123`
- `gerente_yajalon` / `gerente123`
