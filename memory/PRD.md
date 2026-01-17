# SOLES CORPORATIVO - Sistema de Créditos
## Product Requirements Document

### Fecha de Actualización: 2025-01-17
### Version: 1.5

---

## Problema Original
Sistema financiero integral para SOLES CORPORATIVO – CRÉDITOS. Sistema de administración del ciclo completo del crédito.

---

## Funcionalidades Implementadas

### ✅ Autenticación y Usuarios (RBAC)
- Login con JWT, roles RBAC
- Gestión de usuarios (editar/eliminar/contraseña)

### ✅ Gestión de Clientes y Créditos
- CRUD completo con filtros avanzados por localidad y asesor
- Evidencias fotográficas obligatorias

### ✅ Sistema de Cobranza Mejorado
- 5 tarjetas resumen (Hoy, Atrasados, Por Vencer)
- Botón "Mapa" con integración Leaflet
- Flujo "NO PAGO" con evidencia

### ✅ Mapa Interactivo con Leaflet (NUEVO v1.5)
- Modal de mapa con OpenStreetMap
- Marcador de ubicación del cliente
- Botones para abrir Google Maps, Waze
- Botón de llamada directa al cliente

### ✅ Caja Regional del Supervisor
- Estado de cierres del día
- Resumen por localidad y asesor
- Flujo de cierre jerárquico

### ✅ Dashboard de Supervisor en Tiempo Real
- Métricas de rendimiento y alertas
- Auto-actualización cada 30 segundos

### ✅ Programación de Desembolsos
- Solicitud con evidencia de tarjeta
- Ejecución con evidencia obligatoria
- Flujo de aprobación completo

### ✅ Sistema de Notificaciones
- UI en sidebar con dropdown
- Contador de no leídas
- Polling automático cada 30s

### ✅ Asignación Automática por Región
- Botón de asignación masiva
- Asigna asesores a supervisores de su región

### ✅ Reportes Exportables (NUEVO v1.5)
- 4 tipos: Cobranza, Cartera, Pagos, Clientes
- Filtros por región y asesor
- Exportación a Excel (.xlsx) y PDF
- Vista previa de datos

### ✅ Score Interno de Clientes (NUEVO v1.5)
- Puntuación 0-100 basada en historial
- Categorías: EXCELENTE, BUENO, REGULAR, BAJO, CRÍTICO
- Métricas detalladas (pagos a tiempo, atrasos, incidencias)
- Recomendaciones automáticas
- Visible en detalle del cliente, tab "Créditos"

### ✅ Tickets de Pago (NUEVO v1.5)
- Comprobante imprimible después de cada pago
- Formato de ticket térmico (80mm)
- Datos del cliente, monto, folio, saldo restante
- Botón de impresión integrado

---

## Stack Tecnológico
- **Backend**: FastAPI + Python + MongoDB
- **Frontend**: React + TailwindCSS + Shadcn UI
- **Mapas**: Leaflet + OpenStreetMap
- **Reportes**: xlsx, jsPDF, jspdf-autotable

---

## Backlog Pendiente

### P1 (Próximas)
- ⏸️ Notificaciones SMS con Twilio (pendiente credenciales)

### P2 (Futuro)
- Notificaciones WhatsApp
- Firma digital del cliente
- Generación de estados de cuenta

---

## Endpoints API Nuevos (v1.5)

### Score de Clientes
- `GET /api/clients/{id}/score` - Calcular y obtener score

### Pagos (actualizado)
- `GET /api/payments?fecha_inicio=&fecha_fin=&asesor_id=` - Filtros mejorados

---

## Credenciales de Prueba
- `developer` / `developer123`
- `admin` / `admin123`

---

## Changelog
- **v1.5 (2025-01-17)**:
  - Mapa interactivo con Leaflet (OpenStreetMap, Google Maps, Waze)
  - Reportes exportables (Excel/PDF) con 4 tipos de reporte
  - Score interno de clientes (0-100, categorías, recomendaciones)
  - Tickets de pago imprimibles (formato térmico 80mm)
- **v1.4**: Evidencia en desembolsos, notificaciones, asignación automática
- **v1.3**: Cobranza mejorada, caja regional, dashboard supervisor
- **v1.2**: Gestión de usuarios, filtros avanzados
- **v1.0**: MVP inicial
