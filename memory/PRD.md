# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha: 2024-01-15
### Version: 1.0 (MVP)

---

## Problema Original
Sistema financiero integral para SOLES CORPORATIVO – CRÉDITOS. Sistema de administración del ciclo completo del crédito: captura de clientes, gestión de créditos, asignación de cartera, cobranza diaria, control de estatus, cierre de caja, alertas automáticas.

---

## Usuarios y Roles (RBAC)

| Rol | Permisos |
|-----|----------|
| **Desarrollador** | Acceso total al sistema, configuración, logs |
| **Administrador** | Gestión de usuarios, reportes globales |
| **Gerente Regional** | Autoriza créditos, ve cartera regional |
| **Supervisor** | Asigna cartera a asesores, valida información |
| **Asesor de Crédito** | Alta clientes, registra pagos |

---

## Funcionalidades Implementadas

### ✅ Autenticación y Usuarios
- Login con usuario/contraseña (JWT)
- Roles RBAC con permisos estrictos
- Creación de usuarios limitada por región/rol
- Usuarios de prueba: developer, admin, gerente_yajalon

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
- Solo Gerente Regional puede autorizar
- Requiere evidencias completas del cliente

### ✅ Sistema de Cobranza
- Alertas automáticas por estatus
- Pagos del día, atrasados, próximos a vencer
- Registro de pagos por asesor
- Métodos: efectivo, transferencia, depósito

### ✅ Asignación de Cartera
- Solo supervisores pueden asignar
- Selección múltiple de clientes
- Limitado a región del supervisor

### ✅ Caja y Cierre
- Resumen de caja por día
- Cierre de caja con notas
- Historial de cierres
- Total cobrado y pagos registrados

### ✅ Auditoría
- Log de todas las acciones del sistema
- Filtros por entidad y usuario
- Trazabilidad completa

### ✅ Regiones Soportadas
- Yajalón, Chilón, Bachajón, Temo, Petalcingo, Tumbalá, Tila

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

## Backlog P0/P1/P2

### P0 (Completado)
- ✅ Autenticación JWT
- ✅ CRUD Clientes
- ✅ CRUD Créditos
- ✅ Registro de pagos
- ✅ Dashboard con estadísticas
- ✅ Sistema de alertas

### P1 (Próximas)
- Reportes exportables (PDF/Excel)
- Notificaciones push/email
- Firma digital de contratos
- Tickets de pago impresos

### P2 (Futuro)
- Integración WhatsApp automático
- Score interno de clientes
- App móvil nativa
- Geolocalización en tiempo real

---

## Próximos Pasos
1. Implementar reportes exportables
2. Añadir validación de evidencias antes de créditos
3. Integrar firma digital para contratos
4. Configurar notificaciones automáticas
