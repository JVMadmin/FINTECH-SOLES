from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from fastapi.staticfiles import StaticFiles
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
import shutil

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'soles-corporativo-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create uploads directory
UPLOADS_DIR = ROOT_DIR / 'uploads'
UPLOADS_DIR.mkdir(exist_ok=True)

# Create the main app
app = FastAPI(title="SOLES CORPORATIVO - Sistema de Créditos")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== ENUMS ==============
ROLES = ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"]
CREDIT_STATUS = ["pendiente", "autorizado", "vigente", "atrasado", "vencido", "liquidado", "rechazado"]
CLIENT_STATUS = ["vigente", "atrasado", "vencido"]
CREDIT_TYPES = ["diario", "semanal", "catorcenal"]
PAYMENT_METHODS = ["efectivo", "transferencia", "deposito"]
NO_PAYMENT_REASONS = ["no_pago", "no_localizado", "promesa_pago", "otro"]

# Estructura jerárquica de zonas: Sede Regional -> Comunidades
REGIONS_STRUCTURE = {
    "yajalon": {
        "nombre": "Yajalón",
        "tipo": "sede_regional",
        "numero_region": 3,
        "comunidades": ["chilon", "bachajon", "temo", "petalcingo", "tumbala", "tila"]
    }
}

# Lista plana de todas las localidades
LOCALIDADES = ["yajalon", "chilon", "bachajon", "temo", "petalcingo", "tumbala", "tila"]

# Para compatibilidad
REGIONS = LOCALIDADES

# ============== MODELS ==============
class UserCreate(BaseModel):
    username: str
    password: str
    nombre_completo: str
    rol: str
    region: Optional[str] = None
    telefono: Optional[str] = None
    supervisor_id: Optional[str] = None  # Para asesores: ID del supervisor asignado

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    nombre_completo: str
    rol: str
    region: Optional[str] = None
    telefono: Optional[str] = None
    activo: bool = True
    created_at: str
    supervisor_id: Optional[str] = None
    supervisor_nombre: Optional[str] = None

class AssignSupervisorRequest(BaseModel):
    supervisor_id: str
    region: str

class AssignAsesorRequest(BaseModel):
    asesor_id: str
    supervisor_id: str

class ClientCreate(BaseModel):
    nombre_completo: str
    telefono: str
    direccion: str
    region: str
    referencias: Optional[List[dict]] = []  # [{nombre, telefono, relacion}]
    foto_cliente: Optional[str] = None
    foto_domicilio: Optional[str] = None
    foto_negocio: Optional[str] = None
    coordenadas_domicilio: Optional[dict] = None  # {lat, lng}
    coordenadas_negocio: Optional[dict] = None

class ClientResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    nombre_completo: str
    telefono: str
    direccion: str
    region: str
    referencias: List[dict] = []
    asesor_id: Optional[str] = None
    asesor_nombre: Optional[str] = None
    estatus: str = "vigente"
    foto_cliente: Optional[str] = None
    foto_domicilio: Optional[str] = None
    foto_negocio: Optional[str] = None
    coordenadas_domicilio: Optional[dict] = None
    coordenadas_negocio: Optional[dict] = None
    created_at: str
    created_by: Optional[str] = None

class CreditCreate(BaseModel):
    cliente_id: str
    monto_otorgado: float
    tipo_credito: str  # diario, semanal, catorcenal
    plazo: int  # numero de pagos
    monto_por_pago: float
    modalidad_inicio: str  # dia_siguiente, proxima_fecha_pago
    fecha_inicio: Optional[str] = None

class CreditResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    cliente_id: str
    cliente_nombre: Optional[str] = None
    monto_otorgado: float
    tipo_credito: str
    plazo: int
    numero_pagos: int
    monto_por_pago: float
    fecha_inicio: str
    fecha_vencimiento: str
    estatus: str
    pagos_realizados: int = 0
    saldo_pendiente: float
    calendario_pagos: List[dict] = []
    created_at: str
    autorizado_por: Optional[str] = None
    autorizado_fecha: Optional[str] = None
    asesor_id: Optional[str] = None
    region: Optional[str] = None

class PaymentCreate(BaseModel):
    credito_id: str
    monto: float
    metodo_pago: str = "efectivo"
    notas: Optional[str] = None

class NoPaymentCreate(BaseModel):
    credito_id: str
    motivo: str  # no_pago, no_localizado, promesa_pago, otro
    descripcion: Optional[str] = None
    evidencia_url: Optional[str] = None  # Foto de evidencia de intento de contacto
    fecha_promesa: Optional[str] = None  # Si es promesa de pago

class PaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    credito_id: str
    cliente_id: str
    cliente_nombre: Optional[str] = None
    monto: float
    metodo_pago: str
    fecha_pago: str
    notas: Optional[str] = None
    registrado_por: str
    region: str

class NoPaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    credito_id: str
    cliente_id: str
    cliente_nombre: Optional[str] = None
    motivo: str
    descripcion: Optional[str] = None
    evidencia_url: Optional[str] = None
    fecha_registro: str
    registrado_por: str
    fecha_promesa: Optional[str] = None

class ActivateCreditRequest(BaseModel):
    evidencia_desembolso: str  # URL de la foto del desembolso

class CashBoxCreate(BaseModel):
    notas: Optional[str] = None

class CashBoxResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    fecha: str
    region: str
    asesor_id: str
    asesor_nombre: str
    total_cobrado: float
    numero_pagos: int
    estatus: str  # abierto, cerrado
    cerrado_por: Optional[str] = None
    cerrado_fecha: Optional[str] = None

class LogEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    usuario_id: str
    usuario_nombre: str
    accion: str
    entidad: str
    entidad_id: str
    detalles: dict
    timestamp: str
    ip: Optional[str] = None

class AssignCarteraRequest(BaseModel):
    cliente_ids: List[str]
    asesor_id: str

class DisbursementRequest(BaseModel):
    """Solicitud de desembolso programado"""
    cliente_id: str
    monto: float
    tipo_credito: str  # diario, semanal, catorcenal
    plazo: int
    fecha_desembolso: str  # YYYY-MM-DD
    es_renovacion: bool = False
    credito_anterior_id: Optional[str] = None
    notas: Optional[str] = None

class DisbursementResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    cliente_id: str
    cliente_nombre: str
    monto: float
    tipo_credito: str
    plazo: int
    fecha_desembolso: str
    es_renovacion: bool
    estatus: str  # pendiente, aprobado, rechazado, ejecutado
    solicitado_por: str
    solicitado_por_nombre: str
    fecha_solicitud: str
    revisado_por: Optional[str] = None
    revisado_por_nombre: Optional[str] = None
    fecha_revision: Optional[str] = None
    notas: Optional[str] = None
    motivo_rechazo: Optional[str] = None

class AlertResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    tipo: str  # pago_hoy, atrasado, por_vencer
    credito_id: str
    cliente_id: str
    cliente_nombre: str
    monto_pendiente: float
    fecha_pago: str
    dias_atraso: int = 0
    tipo_credito: str = ""  # diario, semanal, catorcenal
    cliente_telefono: str = ""
    cliente_direccion: str = ""
    coordenadas_domicilio: Optional[dict] = None
    asesor_nombre: str = ""

# ============== HELPER FUNCTIONS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_data: dict) -> str:
    payload = {
        "sub": user_data["id"],
        "username": user_data["username"],
        "rol": user_data["rol"],
        "region": user_data.get("region"),
        "nombre": user_data["nombre_completo"],
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

def calculate_payment_schedule(tipo_credito: str, plazo: int, monto_por_pago: float, fecha_inicio: datetime) -> List[dict]:
    """Calcula el calendario de pagos según el tipo de crédito"""
    schedule = []
    current_date = fecha_inicio
    
    for i in range(plazo):
        if tipo_credito == "diario":
            # Saltar fines de semana
            while current_date.weekday() >= 5:  # 5=sábado, 6=domingo
                current_date += timedelta(days=1)
            payment_date = current_date
            current_date += timedelta(days=1)
        elif tipo_credito == "semanal":
            payment_date = current_date
            current_date += timedelta(days=7)
        elif tipo_credito == "catorcenal":
            payment_date = current_date
            current_date += timedelta(days=14)
        else:
            payment_date = current_date
            current_date += timedelta(days=1)
        
        schedule.append({
            "numero_pago": i + 1,
            "fecha": payment_date.strftime("%Y-%m-%d"),
            "monto": monto_por_pago,
            "pagado": False,
            "fecha_pago_real": None
        })
    
    return schedule

async def log_action(usuario_id: str, usuario_nombre: str, accion: str, entidad: str, entidad_id: str, detalles: dict):
    """Registra una acción en el log de auditoría"""
    log_entry = {
        "id": str(uuid.uuid4()),
        "usuario_id": usuario_id,
        "usuario_nombre": usuario_nombre,
        "accion": accion,
        "entidad": entidad,
        "entidad_id": entidad_id,
        "detalles": detalles,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    await db.logs.insert_one(log_entry)

def check_role(user: dict, allowed_roles: List[str]):
    """Verifica si el usuario tiene un rol permitido"""
    if user["rol"] not in allowed_roles:
        raise HTTPException(status_code=403, detail="No tiene permisos para esta acción")

# ============== AUTH ROUTES ==============
@api_router.post("/auth/login")
async def login(data: UserLogin):
    user = await db.users.find_one({"username": data.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    if not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    
    if not user.get("activo", True):
        raise HTTPException(status_code=401, detail="Usuario desactivado")
    
    token = create_token(user)
    
    await log_action(user["id"], user["nombre_completo"], "login", "usuario", user["id"], {"ip": "system"})
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "nombre_completo": user["nombre_completo"],
            "rol": user["rol"],
            "region": user.get("region")
        }
    }

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    user_data = await db.users.find_one({"id": user["sub"]}, {"_id": 0, "password": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user_data

# ============== USER ROUTES ==============
@api_router.post("/users", response_model=UserResponse)
async def create_user(data: UserCreate, user: dict = Depends(get_current_user)):
    # Solo ciertos roles pueden crear usuarios
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    # Validar rol
    if data.rol not in ROLES:
        raise HTTPException(status_code=400, detail=f"Rol inválido. Roles permitidos: {ROLES}")
    
    # Supervisores solo pueden crear asesores de su región
    if user["rol"] == "supervisor":
        if data.rol != "asesor":
            raise HTTPException(status_code=403, detail="Los supervisores solo pueden crear asesores")
        data.region = user["region"]
    
    # Gerentes regionales solo pueden crear usuarios de su región
    if user["rol"] == "gerente_regional":
        if data.rol not in ["supervisor", "asesor"]:
            raise HTTPException(status_code=403, detail="Los gerentes solo pueden crear supervisores y asesores")
        data.region = user["region"]
    
    # Verificar que no exista el usuario
    existing = await db.users.find_one({"username": data.username})
    if existing:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya existe")
    
    # Validar región si es necesario
    if data.rol in ["gerente_regional", "supervisor", "asesor"] and not data.region:
        raise HTTPException(status_code=400, detail="Los roles operativos requieren una región asignada")
    
    if data.region and data.region not in REGIONS:
        raise HTTPException(status_code=400, detail=f"Región inválida. Regiones permitidas: {REGIONS}")
    
    user_dict = {
        "id": str(uuid.uuid4()),
        "username": data.username,
        "password": hash_password(data.password),
        "nombre_completo": data.nombre_completo,
        "rol": data.rol,
        "region": data.region,
        "telefono": data.telefono,
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["sub"]
    }
    
    await db.users.insert_one(user_dict)
    
    await log_action(user["sub"], user["nombre"], "crear_usuario", "usuario", user_dict["id"], 
                    {"username": data.username, "rol": data.rol, "region": data.region})
    
    del user_dict["password"]
    return UserResponse(**user_dict)

@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    query = {}
    
    # Filtrar por región según el rol
    if user["rol"] in ["gerente_regional", "supervisor"]:
        query["region"] = user["region"]
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    return [UserResponse(**u) for u in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    user_data = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar acceso por región
    if user["rol"] in ["gerente_regional", "supervisor"]:
        if user_data.get("region") != user["region"]:
            raise HTTPException(status_code=403, detail="No tiene acceso a este usuario")
    
    # Obtener nombre del supervisor si existe
    if user_data.get("supervisor_id"):
        supervisor = await db.users.find_one({"id": user_data["supervisor_id"]}, {"_id": 0})
        if supervisor:
            user_data["supervisor_nombre"] = supervisor.get("nombre_completo")
    
    return UserResponse(**user_data)

# ============== ASSIGNMENT ROUTES ==============
@api_router.post("/users/assign-supervisor")
async def assign_supervisor_to_region(data: AssignSupervisorRequest, user: dict = Depends(get_current_user)):
    """Asignar un supervisor a una región - Solo Gerente Regional, Admin o Desarrollador"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional"])
    
    # Verificar que el supervisor existe y tiene rol correcto
    supervisor = await db.users.find_one({"id": data.supervisor_id, "rol": "supervisor"}, {"_id": 0})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
    
    # Verificar que la región es válida
    if data.region not in LOCALIDADES:
        raise HTTPException(status_code=400, detail=f"Región inválida. Opciones: {LOCALIDADES}")
    
    # Gerente regional solo puede asignar a su región
    if user["rol"] == "gerente_regional" and data.region != user["region"]:
        raise HTTPException(status_code=403, detail="Solo puede asignar supervisores a su región")
    
    # Actualizar supervisor
    await db.users.update_one(
        {"id": data.supervisor_id},
        {"$set": {
            "region": data.region,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_action(user["sub"], user["nombre"], "asignar_supervisor_region", "usuario", data.supervisor_id,
                    {"region": data.region, "supervisor": supervisor["nombre_completo"]})
    
    return {"message": f"Supervisor asignado a {data.region}"}

@api_router.post("/users/assign-asesor")
async def assign_asesor_to_supervisor(data: AssignAsesorRequest, user: dict = Depends(get_current_user)):
    """Asignar un asesor a un supervisor - Solo Supervisor de la región"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    # Verificar que el asesor existe
    asesor = await db.users.find_one({"id": data.asesor_id, "rol": "asesor"}, {"_id": 0})
    if not asesor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    
    # Verificar que el supervisor existe
    supervisor = await db.users.find_one({"id": data.supervisor_id, "rol": "supervisor"}, {"_id": 0})
    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor no encontrado")
    
    # Si es supervisor, solo puede asignar asesores a sí mismo
    if user["rol"] == "supervisor":
        if data.supervisor_id != user["sub"]:
            raise HTTPException(status_code=403, detail="Solo puede asignar asesores a su propia cuenta")
    
    # Actualizar asesor con supervisor y región del supervisor
    await db.users.update_one(
        {"id": data.asesor_id},
        {"$set": {
            "supervisor_id": data.supervisor_id,
            "supervisor_nombre": supervisor["nombre_completo"],
            "region": supervisor["region"],
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_action(user["sub"], user["nombre"], "asignar_asesor_supervisor", "usuario", data.asesor_id,
                    {"supervisor": supervisor["nombre_completo"], "asesor": asesor["nombre_completo"]})
    
    return {"message": f"Asesor asignado al supervisor {supervisor['nombre_completo']}"}

@api_router.get("/users/my-asesores")
async def get_my_asesores(user: dict = Depends(get_current_user)):
    """Obtener asesores asignados al supervisor actual"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    query = {"rol": "asesor", "activo": True}
    
    if user["rol"] == "supervisor":
        query["supervisor_id"] = user["sub"]
    elif user["rol"] == "gerente_regional":
        query["region"] = user["region"]
    
    asesores = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    return asesores

@api_router.get("/users/unassigned-asesores")
async def get_unassigned_asesores(user: dict = Depends(get_current_user)):
    """Obtener asesores sin supervisor asignado"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    query = {
        "rol": "asesor",
        "activo": True,
        "$or": [{"supervisor_id": None}, {"supervisor_id": ""}]
    }
    
    # Supervisor solo ve asesores de su región o sin región
    if user["rol"] == "supervisor":
        query["$or"] = [
            {"supervisor_id": None, "region": user["region"]},
            {"supervisor_id": None, "region": None},
            {"supervisor_id": ""}
        ]
    
    asesores = await db.users.find(query, {"_id": 0, "password": 0}).to_list(100)
    return asesores

@api_router.get("/users/supervisors-by-region/{region}")
async def get_supervisors_by_region(region: str, user: dict = Depends(get_current_user)):
    """Obtener supervisores de una región"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional"])
    
    supervisors = await db.users.find(
        {"region": region, "rol": "supervisor", "activo": True},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return supervisors

@api_router.put("/users/{user_id}")
async def update_user(user_id: str, data: dict, user: dict = Depends(get_current_user)):
    """Actualizar usuario - Admin, Gerente Regional y Supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar permisos por rol y región
    if user["rol"] == "supervisor":
        # Supervisores solo pueden editar asesores de su equipo
        if existing.get("supervisor_id") != user["sub"]:
            raise HTTPException(status_code=403, detail="Solo puede editar asesores de su equipo")
    elif user["rol"] == "gerente_regional":
        # Gerentes solo pueden editar usuarios de su región
        if existing.get("region") != user["region"]:
            raise HTTPException(status_code=403, detail="Solo puede editar usuarios de su región")
    
    # No permitir cambiar el rol a través de este endpoint (solo admin/dev)
    if "rol" in data and user["rol"] not in ["desarrollador", "administrador"]:
        del data["rol"]
    
    if "password" in data and data["password"]:
        data["password"] = hash_password(data["password"])
    else:
        data.pop("password", None)
    
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one({"id": user_id}, {"$set": data})
    
    await log_action(user["sub"], user["nombre"], "actualizar_usuario", "usuario", user_id, 
                    {k: v for k, v in data.items() if k != "password"})
    
    return {"message": "Usuario actualizado"}

@api_router.delete("/users/{user_id}")
async def deactivate_user(user_id: str, user: dict = Depends(get_current_user)):
    """Desactivar usuario - Admin, Gerente Regional y Supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    existing = await db.users.find_one({"id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Verificar permisos por rol y región
    if user["rol"] == "supervisor":
        # Supervisores solo pueden desactivar asesores de su equipo
        if existing.get("supervisor_id") != user["sub"]:
            raise HTTPException(status_code=403, detail="Solo puede desactivar asesores de su equipo")
    elif user["rol"] == "gerente_regional":
        # Gerentes solo pueden desactivar usuarios de su región
        if existing.get("region") != user["region"]:
            raise HTTPException(status_code=403, detail="Solo puede desactivar usuarios de su región")
    
    await db.users.update_one({"id": user_id}, {"$set": {"activo": False, "updated_at": datetime.now(timezone.utc).isoformat()}})
    
    await log_action(user["sub"], user["nombre"], "desactivar_usuario", "usuario", user_id, {"usuario": existing.get("nombre_completo")})
    
    return {"message": "Usuario desactivado"}

@api_router.get("/users/asesores/region/{region}")
async def get_asesores_by_region(region: str, user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    # Verificar acceso por región
    if user["rol"] in ["gerente_regional", "supervisor"] and user["region"] != region:
        raise HTTPException(status_code=403, detail="No tiene acceso a esta región")
    
    asesores = await db.users.find(
        {"region": region, "rol": "asesor", "activo": True},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return asesores

@api_router.get("/users/asesores/all")
async def get_all_asesores(user: dict = Depends(get_current_user)):
    """Obtener todos los asesores - Solo para desarrollador/administrador"""
    check_role(user, ["desarrollador", "administrador"])
    
    asesores = await db.users.find(
        {"rol": "asesor", "activo": True},
        {"_id": 0, "password": 0}
    ).to_list(100)
    
    return asesores

# ============== CLIENT ROUTES ==============
@api_router.post("/clients", response_model=ClientResponse)
async def create_client(data: ClientCreate, user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    if data.region not in REGIONS:
        raise HTTPException(status_code=400, detail=f"Región inválida. Regiones permitidas: {REGIONS}")
    
    # Verificar región si es asesor o supervisor
    if user["rol"] in ["asesor", "supervisor", "gerente_regional"]:
        if data.region != user["region"]:
            raise HTTPException(status_code=403, detail="Solo puede crear clientes en su región")
    
    client_dict = {
        "id": str(uuid.uuid4()),
        "nombre_completo": data.nombre_completo,
        "telefono": data.telefono,
        "direccion": data.direccion,
        "region": data.region,
        "referencias": data.referencias or [],
        "asesor_id": user["sub"] if user["rol"] == "asesor" else None,
        "asesor_nombre": user["nombre"] if user["rol"] == "asesor" else None,
        "estatus": "vigente",
        "foto_cliente": data.foto_cliente,
        "foto_domicilio": data.foto_domicilio,
        "foto_negocio": data.foto_negocio,
        "coordenadas_domicilio": data.coordenadas_domicilio,
        "coordenadas_negocio": data.coordenadas_negocio,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["sub"]
    }
    
    await db.clients.insert_one(client_dict)
    
    await log_action(user["sub"], user["nombre"], "crear_cliente", "cliente", client_dict["id"],
                    {"nombre": data.nombre_completo, "region": data.region})
    
    return ClientResponse(**client_dict)

@api_router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    region: Optional[str] = None,
    estatus: Optional[str] = None,
    asesor_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    # Filtrar por rol
    if user["rol"] == "asesor":
        query["asesor_id"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    elif region:
        query["region"] = region
    
    if estatus:
        query["estatus"] = estatus
    
    if asesor_id and user["rol"] != "asesor":
        query["asesor_id"] = asesor_id
    
    clients = await db.clients.find(query, {"_id": 0}).to_list(1000)
    return [ClientResponse(**c) for c in clients]

@api_router.get("/clients/{client_id}", response_model=ClientResponse)
async def get_client(client_id: str, user: dict = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Verificar acceso
    if user["rol"] == "asesor" and client.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    if user["rol"] in ["supervisor", "gerente_regional"] and client.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    return ClientResponse(**client)

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, data: dict, user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    client = await db.clients.find_one({"id": client_id})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Verificar acceso
    if user["rol"] == "asesor" and client.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    if user["rol"] in ["supervisor", "gerente_regional"] and client.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    # No permitir cambiar asesor desde aquí
    data.pop("asesor_id", None)
    data.pop("asesor_nombre", None)
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.clients.update_one({"id": client_id}, {"$set": data})
    
    await log_action(user["sub"], user["nombre"], "actualizar_cliente", "cliente", client_id, data)
    
    return {"message": "Cliente actualizado"}

# ============== CARTERA (PORTFOLIO) ROUTES ==============
@api_router.post("/cartera/assign")
async def assign_cartera(data: AssignCarteraRequest, user: dict = Depends(get_current_user)):
    """Asignar clientes a un asesor - Solo supervisor"""
    check_role(user, ["desarrollador", "administrador", "supervisor"])
    
    # Verificar que el asesor existe y está en la misma región
    asesor = await db.users.find_one({"id": data.asesor_id, "rol": "asesor"}, {"_id": 0})
    if not asesor:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    
    if user["rol"] == "supervisor" and asesor.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="El asesor no pertenece a su región")
    
    # Actualizar los clientes
    for client_id in data.cliente_ids:
        client = await db.clients.find_one({"id": client_id})
        if client:
            if user["rol"] == "supervisor" and client.get("region") != user["region"]:
                continue  # Saltar clientes de otra región
            
            await db.clients.update_one(
                {"id": client_id},
                {"$set": {
                    "asesor_id": data.asesor_id,
                    "asesor_nombre": asesor["nombre_completo"],
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    await log_action(user["sub"], user["nombre"], "asignar_cartera", "cartera", data.asesor_id,
                    {"clientes": data.cliente_ids})
    
    return {"message": f"Cartera asignada a {asesor['nombre_completo']}"}

@api_router.get("/cartera/unassigned")
async def get_unassigned_clients(user: dict = Depends(get_current_user)):
    """Obtener clientes sin asesor asignado"""
    check_role(user, ["desarrollador", "administrador", "supervisor"])
    
    query = {"$or": [{"asesor_id": None}, {"asesor_id": ""}]}
    
    if user["rol"] == "supervisor":
        query["region"] = user["region"]
    
    clients = await db.clients.find(query, {"_id": 0}).to_list(1000)
    return [ClientResponse(**c) for c in clients]

# ============== CREDIT ROUTES ==============
@api_router.post("/credits", response_model=CreditResponse)
async def create_credit(data: CreditCreate, user: dict = Depends(get_current_user)):
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    # Validar tipo de crédito
    if data.tipo_credito not in CREDIT_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de crédito inválido. Tipos permitidos: {CREDIT_TYPES}")
    
    # Obtener cliente
    client = await db.clients.find_one({"id": data.cliente_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    
    # Verificar evidencias obligatorias
    if not all([client.get("foto_cliente"), client.get("foto_domicilio"), client.get("foto_negocio"),
                client.get("coordenadas_domicilio"), client.get("coordenadas_negocio")]):
        raise HTTPException(status_code=400, detail="El cliente debe tener todas las evidencias completas antes de solicitar un crédito")
    
    # Verificar acceso por rol
    if user["rol"] == "asesor" and client.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    if user["rol"] in ["supervisor", "gerente_regional"] and client.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este cliente")
    
    # Calcular fecha de inicio
    now = datetime.now(timezone.utc)
    if data.modalidad_inicio == "dia_siguiente":
        fecha_inicio = now + timedelta(days=1)
    else:  # proxima_fecha_pago
        if data.tipo_credito == "diario":
            # Próximo día hábil
            fecha_inicio = now + timedelta(days=1)
            while fecha_inicio.weekday() >= 5:
                fecha_inicio += timedelta(days=1)
        elif data.tipo_credito == "semanal":
            fecha_inicio = now + timedelta(days=7)
        else:  # catorcenal
            fecha_inicio = now + timedelta(days=14)
    
    # Calcular calendario de pagos
    calendario = calculate_payment_schedule(data.tipo_credito, data.plazo, data.monto_por_pago, fecha_inicio)
    
    # Fecha de vencimiento es el último pago
    fecha_vencimiento = calendario[-1]["fecha"] if calendario else fecha_inicio.strftime("%Y-%m-%d")
    
    credit_dict = {
        "id": str(uuid.uuid4()),
        "cliente_id": data.cliente_id,
        "cliente_nombre": client["nombre_completo"],
        "monto_otorgado": data.monto_otorgado,
        "tipo_credito": data.tipo_credito,
        "plazo": data.plazo,
        "numero_pagos": data.plazo,
        "monto_por_pago": data.monto_por_pago,
        "fecha_inicio": fecha_inicio.strftime("%Y-%m-%d"),
        "fecha_vencimiento": fecha_vencimiento,
        "estatus": "pendiente",  # Requiere autorización
        "pagos_realizados": 0,
        "saldo_pendiente": data.monto_otorgado,
        "calendario_pagos": calendario,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["sub"],
        "asesor_id": client.get("asesor_id"),
        "region": client.get("region"),
        "autorizado_por": None,
        "autorizado_fecha": None
    }
    
    await db.credits.insert_one(credit_dict)
    
    await log_action(user["sub"], user["nombre"], "crear_credito", "credito", credit_dict["id"],
                    {"cliente": client["nombre_completo"], "monto": data.monto_otorgado, "tipo": data.tipo_credito})
    
    return CreditResponse(**credit_dict)

@api_router.get("/credits", response_model=List[CreditResponse])
async def get_credits(
    region: Optional[str] = None,
    estatus: Optional[str] = None,
    cliente_id: Optional[str] = None,
    asesor_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    # Filtrar por rol
    if user["rol"] == "asesor":
        query["asesor_id"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    elif region:
        query["region"] = region
    
    if estatus:
        query["estatus"] = estatus
    
    if cliente_id:
        query["cliente_id"] = cliente_id
    
    if asesor_id and user["rol"] != "asesor":
        query["asesor_id"] = asesor_id
    
    credits = await db.credits.find(query, {"_id": 0}).to_list(1000)
    return [CreditResponse(**c) for c in credits]

@api_router.get("/credits/{credit_id}", response_model=CreditResponse)
async def get_credit(credit_id: str, user: dict = Depends(get_current_user)):
    credit = await db.credits.find_one({"id": credit_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    # Verificar acceso
    if user["rol"] == "asesor" and credit.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este crédito")
    
    if user["rol"] in ["supervisor", "gerente_regional"] and credit.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este crédito")
    
    return CreditResponse(**credit)

@api_router.post("/credits/{credit_id}/authorize")
async def authorize_credit(credit_id: str, user: dict = Depends(get_current_user)):
    """Autorizar un crédito - Gerente Regional y Supervisor"""
    check_role(user, ["desarrollador", "gerente_regional", "supervisor"])
    
    credit = await db.credits.find_one({"id": credit_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credit["estatus"] != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden autorizar créditos pendientes")
    
    # Verificar región
    if user["rol"] in ["gerente_regional", "supervisor"] and credit.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a créditos de otra región")
    
    await db.credits.update_one(
        {"id": credit_id},
        {"$set": {
            "estatus": "autorizado",
            "autorizado_por": user["sub"],
            "autorizado_fecha": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    await log_action(user["sub"], user["nombre"], "autorizar_credito", "credito", credit_id,
                    {"cliente": credit["cliente_nombre"], "monto": credit["monto_otorgado"]})
    
    return {"message": "Crédito autorizado"}

@api_router.post("/credits/{credit_id}/reject")
async def reject_credit(credit_id: str, motivo: str = "Sin especificar", user: dict = Depends(get_current_user)):
    """Rechazar un crédito - Gerente Regional y Supervisor"""
    check_role(user, ["desarrollador", "gerente_regional", "supervisor"])
    
    credit = await db.credits.find_one({"id": credit_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credit["estatus"] != "pendiente":
        raise HTTPException(status_code=400, detail="Solo se pueden rechazar créditos pendientes")
    
    # Verificar región
    if user["rol"] in ["gerente_regional", "supervisor"] and credit.get("region") != user["region"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a créditos de otra región")
    
    await db.credits.update_one(
        {"id": credit_id},
        {"$set": {
            "estatus": "rechazado",
            "rechazado_por": user["sub"],
            "rechazado_fecha": datetime.now(timezone.utc).isoformat(),
            "motivo_rechazo": motivo
        }}
    )
    
    await log_action(user["sub"], user["nombre"], "rechazar_credito", "credito", credit_id,
                    {"cliente": credit["cliente_nombre"], "motivo": motivo})
    
    return {"message": "Crédito rechazado"}

@api_router.post("/credits/{credit_id}/activate")
async def activate_credit(credit_id: str, data: ActivateCreditRequest, user: dict = Depends(get_current_user)):
    """Activar crédito después de desembolso - Requiere evidencia fotográfica"""
    check_role(user, ["desarrollador", "gerente_regional", "supervisor", "asesor"])
    
    credit = await db.credits.find_one({"id": credit_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credit["estatus"] != "autorizado":
        raise HTTPException(status_code=400, detail="Solo se pueden activar créditos autorizados")
    
    # Verificar que se proporcione evidencia
    if not data.evidencia_desembolso:
        raise HTTPException(status_code=400, detail="Se requiere evidencia fotográfica del desembolso")
    
    await db.credits.update_one(
        {"id": credit_id},
        {"$set": {
            "estatus": "vigente",
            "activado_por": user["sub"],
            "activado_fecha": datetime.now(timezone.utc).isoformat(),
            "evidencia_desembolso": data.evidencia_desembolso
        }}
    )
    
    await log_action(user["sub"], user["nombre"], "activar_credito", "credito", credit_id,
                    {"cliente": credit["cliente_nombre"], "evidencia": data.evidencia_desembolso})
    
    return {"message": "Crédito activado con evidencia de desembolso"}

# ============== PAYMENT ROUTES ==============
@api_router.post("/payments", response_model=PaymentResponse)
async def create_payment(data: PaymentCreate, user: dict = Depends(get_current_user)):
    """Registrar un pago - Asesor y Supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    credit = await db.credits.find_one({"id": data.credito_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credit["estatus"] not in ["vigente", "atrasado"]:
        raise HTTPException(status_code=400, detail="Solo se pueden registrar pagos en créditos vigentes o atrasados")
    
    # Verificar acceso del asesor
    if user["rol"] == "asesor" and credit.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este crédito")
    
    # Crear pago
    payment_dict = {
        "id": str(uuid.uuid4()),
        "credito_id": data.credito_id,
        "cliente_id": credit["cliente_id"],
        "cliente_nombre": credit["cliente_nombre"],
        "monto": data.monto,
        "metodo_pago": data.metodo_pago,
        "fecha_pago": datetime.now(timezone.utc).isoformat(),
        "notas": data.notas,
        "registrado_por": user["sub"],
        "registrado_por_nombre": user["nombre"],
        "region": credit["region"]
    }
    
    await db.payments.insert_one(payment_dict)
    
    # Actualizar crédito
    nuevo_saldo = credit["saldo_pendiente"] - data.monto
    nuevos_pagos = credit["pagos_realizados"] + 1
    
    # Actualizar calendario de pagos
    calendario = credit["calendario_pagos"]
    for pago in calendario:
        if not pago["pagado"]:
            pago["pagado"] = True
            pago["fecha_pago_real"] = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            break
    
    # Determinar nuevo estatus
    nuevo_estatus = credit["estatus"]
    if nuevo_saldo <= 0:
        nuevo_estatus = "liquidado"
    
    await db.credits.update_one(
        {"id": data.credito_id},
        {"$set": {
            "saldo_pendiente": max(0, nuevo_saldo),
            "pagos_realizados": nuevos_pagos,
            "calendario_pagos": calendario,
            "estatus": nuevo_estatus,
            "ultimo_pago": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Actualizar estatus del cliente si es necesario
    if nuevo_estatus == "vigente":
        await db.clients.update_one({"id": credit["cliente_id"]}, {"$set": {"estatus": "vigente"}})
    
    await log_action(user["sub"], user["nombre"], "registrar_pago", "pago", payment_dict["id"],
                    {"credito": data.credito_id, "monto": data.monto, "cliente": credit["cliente_nombre"]})
    
    return PaymentResponse(**payment_dict)

@api_router.get("/payments", response_model=List[PaymentResponse])
async def get_payments(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    credito_id: Optional[str] = None,
    region: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    query = {}
    
    # Filtrar por rol
    if user["rol"] == "asesor":
        query["registrado_por"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    elif region:
        query["region"] = region
    
    if credito_id:
        query["credito_id"] = credito_id
    
    payments = await db.payments.find(query, {"_id": 0}).to_list(1000)
    return [PaymentResponse(**p) for p in payments]

# ============== NO PAYMENT (INCIDENCIAS) ROUTES ==============
@api_router.post("/no-payments", response_model=NoPaymentResponse)
async def register_no_payment(data: NoPaymentCreate, user: dict = Depends(get_current_user)):
    """Registrar incidencia de no pago - Asesor y Supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    if data.motivo not in NO_PAYMENT_REASONS:
        raise HTTPException(status_code=400, detail=f"Motivo inválido. Opciones: {NO_PAYMENT_REASONS}")
    
    credit = await db.credits.find_one({"id": data.credito_id}, {"_id": 0})
    if not credit:
        raise HTTPException(status_code=404, detail="Crédito no encontrado")
    
    if credit["estatus"] not in ["vigente", "atrasado"]:
        raise HTTPException(status_code=400, detail="Solo se pueden registrar incidencias en créditos vigentes o atrasados")
    
    # Verificar acceso del asesor
    if user["rol"] == "asesor" and credit.get("asesor_id") != user["sub"]:
        raise HTTPException(status_code=403, detail="No tiene acceso a este crédito")
    
    # Crear registro de no pago
    no_payment_dict = {
        "id": str(uuid.uuid4()),
        "credito_id": data.credito_id,
        "cliente_id": credit["cliente_id"],
        "cliente_nombre": credit["cliente_nombre"],
        "motivo": data.motivo,
        "descripcion": data.descripcion,
        "evidencia_url": data.evidencia_url,
        "fecha_registro": datetime.now(timezone.utc).isoformat(),
        "registrado_por": user["sub"],
        "registrado_por_nombre": user["nombre"],
        "region": credit["region"],
        "fecha_promesa": data.fecha_promesa
    }
    
    await db.no_payments.insert_one(no_payment_dict)
    
    # Actualizar estatus del crédito si está atrasado
    # Buscar el próximo pago pendiente
    calendario = credit.get("calendario_pagos", [])
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    for pago in calendario:
        if not pago["pagado"] and pago["fecha"] <= today:
            # Hay pagos atrasados
            if credit["estatus"] != "atrasado":
                await db.credits.update_one(
                    {"id": data.credito_id},
                    {"$set": {"estatus": "atrasado"}}
                )
                # Actualizar cliente también
                await db.clients.update_one(
                    {"id": credit["cliente_id"]},
                    {"$set": {"estatus": "atrasado"}}
                )
            break
    
    await log_action(user["sub"], user["nombre"], "registrar_no_pago", "no_pago", no_payment_dict["id"],
                    {"credito": data.credito_id, "motivo": data.motivo, "cliente": credit["cliente_nombre"]})
    
    return NoPaymentResponse(**no_payment_dict)

@api_router.get("/no-payments")
async def get_no_payments(
    credito_id: Optional[str] = None,
    cliente_id: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Obtener historial de incidencias de no pago"""
    query = {}
    
    if user["rol"] == "asesor":
        query["registrado_por"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    
    if credito_id:
        query["credito_id"] = credito_id
    if cliente_id:
        query["cliente_id"] = cliente_id
    
    no_payments = await db.no_payments.find(query, {"_id": 0}).sort("fecha_registro", -1).to_list(500)
    return no_payments

# ============== ALERTS ROUTES ==============
@api_router.get("/alerts", response_model=List[AlertResponse])
async def get_alerts(user: dict = Depends(get_current_user)):
    """Obtener alertas de cobranza del día"""
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    query = {"estatus": {"$in": ["vigente", "atrasado"]}}
    
    # Filtrar por rol
    if user["rol"] == "asesor":
        query["asesor_id"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    
    credits = await db.credits.find(query, {"_id": 0}).to_list(1000)
    
    # Obtener información de clientes para coordenadas y teléfono
    client_ids = list(set([c["cliente_id"] for c in credits]))
    clients_data = {}
    if client_ids:
        clients_list = await db.clients.find({"id": {"$in": client_ids}}, {"_id": 0}).to_list(1000)
        clients_data = {c["id"]: c for c in clients_list}
    
    # Obtener información de asesores
    asesor_ids = list(set([c.get("asesor_id") for c in credits if c.get("asesor_id")]))
    asesores_data = {}
    if asesor_ids:
        asesores_list = await db.users.find({"id": {"$in": asesor_ids}}, {"_id": 0, "id": 1, "nombre_completo": 1}).to_list(100)
        asesores_data = {a["id"]: a["nombre_completo"] for a in asesores_list}
    
    alerts = []
    for credit in credits:
        client = clients_data.get(credit["cliente_id"], {})
        asesor_nombre = asesores_data.get(credit.get("asesor_id", ""), "")
        
        for pago in credit.get("calendario_pagos", []):
            if pago["pagado"]:
                continue
            
            fecha_pago = datetime.strptime(pago["fecha"], "%Y-%m-%d")
            today_date = datetime.strptime(today, "%Y-%m-%d")
            dias_diff = (today_date - fecha_pago).days
            
            alert_data = {
                "credito_id": credit["id"],
                "cliente_id": credit["cliente_id"],
                "cliente_nombre": credit["cliente_nombre"],
                "monto_pendiente": pago["monto"],
                "fecha_pago": pago["fecha"],
                "tipo_credito": credit.get("tipo_credito", "diario"),
                "cliente_telefono": client.get("telefono", ""),
                "cliente_direccion": client.get("direccion", ""),
                "coordenadas_domicilio": client.get("coordenadas_domicilio"),
                "asesor_nombre": asesor_nombre
            }
            
            if pago["fecha"] == today:
                alerts.append(AlertResponse(
                    tipo="pago_hoy",
                    dias_atraso=0,
                    **alert_data
                ))
            elif dias_diff > 0:
                alerts.append(AlertResponse(
                    tipo="atrasado",
                    dias_atraso=dias_diff,
                    **alert_data
                ))
            elif dias_diff >= -7:  # 7 días antes para semanales/catorcenales
                alerts.append(AlertResponse(
                    tipo="por_vencer",
                    dias_atraso=0,
                    **alert_data
                ))
            break  # Solo el próximo pago pendiente
    
    # Ordenar: primero atrasados, luego hoy, luego por vencer
    order = {"atrasado": 0, "pago_hoy": 1, "por_vencer": 2}
    alerts.sort(key=lambda x: (order.get(x.tipo, 3), -x.dias_atraso))
    
    return alerts

# ============== CASH BOX ROUTES ==============
@api_router.get("/cashbox/today")
async def get_today_cashbox(user: dict = Depends(get_current_user)):
    """Obtener caja del día actual - Personal para asesor, Regional para supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    is_regional = user["rol"] in ["supervisor", "gerente_regional", "desarrollador", "administrador"]
    
    # Construir query según rol
    if user["rol"] == "asesor":
        payments_query = {"registrado_por": user["sub"]}
    elif user["rol"] == "supervisor":
        # Obtener IDs de asesores bajo este supervisor
        asesores = await db.users.find({"supervisor_id": user["sub"], "rol": "asesor"}, {"_id": 0}).to_list(100)
        asesor_ids = [a["id"] for a in asesores]
        asesor_ids.append(user["sub"])  # Incluir al supervisor también si registró pagos
        payments_query = {"registrado_por": {"$in": asesor_ids}}
    elif user["rol"] == "gerente_regional":
        payments_query = {"region": user["region"]}
    else:
        payments_query = {}
    
    # Obtener pagos del día
    payments = await db.payments.find({
        **payments_query,
        "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    total_cobrado = sum(p["monto"] for p in payments)
    
    # Si es supervisor, agrupar por asesor
    asesores_detalle = []
    if is_regional and user["rol"] == "supervisor":
        asesores = await db.users.find({"supervisor_id": user["sub"], "rol": "asesor"}, {"_id": 0}).to_list(100)
        for asesor in asesores:
            asesor_payments = [p for p in payments if p.get("registrado_por") == asesor["id"]]
            asesores_detalle.append({
                "asesor_id": asesor["id"],
                "asesor_nombre": asesor["nombre_completo"],
                "total_cobrado": sum(p["monto"] for p in asesor_payments),
                "numero_pagos": len(asesor_payments)
            })
    
    cashbox = {
        "id": str(uuid.uuid4()),
        "fecha": today,
        "region": user.get("region", "general"),
        "tipo_caja": "regional" if is_regional else "personal",
        "usuario_id": user["sub"],
        "usuario_nombre": user["nombre"],
        "total_cobrado": total_cobrado,
        "numero_pagos": len(payments),
        "estatus": "abierto",
        "pagos": payments,
        "asesores_detalle": asesores_detalle if is_regional else None
    }
    
    return cashbox

@api_router.get("/cashbox/regional")
async def get_regional_cashbox(
    user: dict = Depends(get_current_user),
    asesor_id: Optional[str] = None,
    localidad: Optional[str] = None
):
    """Obtener resumen de caja regional con detalle por asesor y filtros"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    # Construir query para asesores
    asesor_query = {"rol": "asesor", "activo": True}
    
    if user["rol"] == "supervisor":
        asesor_query["supervisor_id"] = user["sub"]
    elif user["rol"] == "gerente_regional":
        asesor_query["region"] = user["region"]
    
    # Aplicar filtros
    if asesor_id:
        asesor_query["id"] = asesor_id
    if localidad:
        asesor_query["region"] = localidad
    
    asesores = await db.users.find(asesor_query, {"_id": 0}).to_list(100)
    
    cajas_asesores = []
    total_regional = 0
    total_pagos = 0
    pagos_por_localidad = {}
    
    for asesor in asesores:
        payments = await db.payments.find({
            "registrado_por": asesor["id"],
            "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        }, {"_id": 0}).to_list(1000)
        
        asesor_total = sum(p["monto"] for p in payments)
        total_regional += asesor_total
        total_pagos += len(payments)
        
        # Agrupar por localidad
        asesor_region = asesor.get("region", "sin_asignar")
        if asesor_region not in pagos_por_localidad:
            pagos_por_localidad[asesor_region] = {"total": 0, "pagos": 0}
        pagos_por_localidad[asesor_region]["total"] += asesor_total
        pagos_por_localidad[asesor_region]["pagos"] += len(payments)
        
        cajas_asesores.append({
            "asesor_id": asesor["id"],
            "asesor_nombre": asesor["nombre_completo"],
            "region": asesor.get("region", "sin_asignar"),
            "total_cobrado": asesor_total,
            "numero_pagos": len(payments),
            "supervisor_id": asesor.get("supervisor_id"),
            "pagos": payments  # Incluir pagos detallados
        })
    
    # Ordenar por total cobrado descendente
    cajas_asesores.sort(key=lambda x: x["total_cobrado"], reverse=True)
    
    return {
        "fecha": today,
        "region": user.get("region", "todas"),
        "total_regional": total_regional,
        "total_pagos": total_pagos,
        "asesores": cajas_asesores,
        "por_localidad": pagos_por_localidad
    }

@api_router.post("/cashbox/close")
async def close_cashbox(data: CashBoxCreate, user: dict = Depends(get_current_user)):
    """Cerrar caja del día"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "asesor"])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Buscar caja existente
    query = {"fecha": today}
    if user["rol"] == "asesor":
        query["asesor_id"] = user["sub"]
    
    existing = await db.cashbox.find_one(query)
    
    if existing and existing.get("estatus") == "cerrado":
        raise HTTPException(status_code=400, detail="La caja ya fue cerrada")
    
    # Calcular totales
    payments_query = {}
    if user["rol"] == "asesor":
        payments_query["registrado_por"] = user["sub"]
    else:
        payments_query["region"] = user.get("region", "")
    
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    payments = await db.payments.find({
        **payments_query,
        "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    total_cobrado = sum(p["monto"] for p in payments)
    
    cashbox_data = {
        "id": str(uuid.uuid4()),
        "fecha": today,
        "region": user.get("region", "general"),
        "asesor_id": user["sub"] if user["rol"] == "asesor" else None,
        "asesor_nombre": user["nombre"] if user["rol"] == "asesor" else "Regional",
        "total_cobrado": total_cobrado,
        "numero_pagos": len(payments),
        "estatus": "cerrado",
        "cerrado_por": user["sub"],
        "cerrado_fecha": datetime.now(timezone.utc).isoformat(),
        "notas": data.notas
    }
    
    if existing:
        await db.cashbox.update_one({"id": existing["id"]}, {"$set": cashbox_data})
    else:
        await db.cashbox.insert_one(cashbox_data)
    
    await log_action(user["sub"], user["nombre"], "cerrar_caja", "caja", cashbox_data["id"],
                    {"total": total_cobrado, "pagos": len(payments)})
    
    return {"message": "Caja cerrada exitosamente", "total": total_cobrado}

@api_router.get("/cashbox/history")
async def get_cashbox_history(
    fecha_inicio: Optional[str] = None,
    fecha_fin: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    """Obtener historial de cierres de caja"""
    query = {}
    
    if user["rol"] == "asesor":
        query["asesor_id"] = user["sub"]
    elif user["rol"] in ["supervisor", "gerente_regional"]:
        query["region"] = user["region"]
    
    if fecha_inicio and fecha_fin:
        query["fecha"] = {"$gte": fecha_inicio, "$lte": fecha_fin}
    
    cashboxes = await db.cashbox.find(query, {"_id": 0}).sort("fecha", -1).to_list(100)
    return cashboxes

@api_router.get("/cashbox/asesores-status")
async def get_asesores_cashbox_status(user: dict = Depends(get_current_user)):
    """Obtener estado de caja de cada asesor para el supervisor"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    # Obtener asesores del supervisor
    asesor_query = {"rol": "asesor", "activo": True}
    if user["rol"] == "supervisor":
        asesor_query["supervisor_id"] = user["sub"]
    elif user["rol"] == "gerente_regional":
        asesor_query["region"] = user["region"]
    
    asesores = await db.users.find(asesor_query, {"_id": 0}).to_list(100)
    
    asesores_status = []
    total_cobrado_regional = 0
    total_pagos_regional = 0
    asesores_cerrados = 0
    
    for asesor in asesores:
        # Obtener pagos del asesor hoy
        pagos = await db.payments.find({
            "registrado_por": asesor["id"],
            "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        }, {"_id": 0}).to_list(1000)
        
        total_asesor = sum(p["monto"] for p in pagos)
        total_cobrado_regional += total_asesor
        total_pagos_regional += len(pagos)
        
        # Verificar si ya cerró caja
        cierre = await db.cashbox.find_one({
            "fecha": today,
            "asesor_id": asesor["id"],
            "estatus": "cerrado"
        }, {"_id": 0})
        
        if cierre:
            asesores_cerrados += 1
        
        asesores_status.append({
            "asesor_id": asesor["id"],
            "asesor_nombre": asesor["nombre_completo"],
            "region": asesor.get("region", ""),
            "total_cobrado": total_asesor,
            "numero_pagos": len(pagos),
            "caja_cerrada": cierre is not None,
            "hora_cierre": cierre.get("cerrado_fecha", "").split("T")[1][:5] if cierre else None,
            "notas_cierre": cierre.get("notas", "") if cierre else None
        })
    
    # Verificar si la caja regional ya está cerrada
    caja_regional = await db.cashbox.find_one({
        "fecha": today,
        "asesor_id": None,
        "region": user.get("region"),
        "estatus": "cerrado"
    }, {"_id": 0})
    
    return {
        "fecha": today,
        "asesores": asesores_status,
        "resumen": {
            "total_asesores": len(asesores),
            "asesores_cerrados": asesores_cerrados,
            "asesores_pendientes": len(asesores) - asesores_cerrados,
            "total_cobrado_regional": total_cobrado_regional,
            "total_pagos_regional": total_pagos_regional
        },
        "caja_regional_cerrada": caja_regional is not None,
        "puede_cerrar_regional": asesores_cerrados == len(asesores) and len(asesores) > 0,
        "hora_cierre_regional": caja_regional.get("cerrado_fecha", "").split("T")[1][:5] if caja_regional else None
    }

@api_router.post("/cashbox/close-regional")
async def close_regional_cashbox(data: CashBoxCreate, user: dict = Depends(get_current_user)):
    """Cerrar caja regional - Solo supervisor después de que todos los asesores cierren"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Verificar que no esté ya cerrada
    existing = await db.cashbox.find_one({
        "fecha": today,
        "asesor_id": None,
        "region": user.get("region"),
        "estatus": "cerrado"
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="La caja regional ya fue cerrada")
    
    # Verificar que todos los asesores hayan cerrado
    asesor_query = {"rol": "asesor", "activo": True}
    if user["rol"] == "supervisor":
        asesor_query["supervisor_id"] = user["sub"]
    elif user["rol"] == "gerente_regional":
        asesor_query["region"] = user["region"]
    
    asesores = await db.users.find(asesor_query, {"_id": 0}).to_list(100)
    
    for asesor in asesores:
        cierre = await db.cashbox.find_one({
            "fecha": today,
            "asesor_id": asesor["id"],
            "estatus": "cerrado"
        })
        if not cierre:
            raise HTTPException(
                status_code=400, 
                detail=f"El asesor {asesor['nombre_completo']} aún no ha cerrado su caja"
            )
    
    # Calcular totales regionales
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    asesor_ids = [a["id"] for a in asesores]
    payments = await db.payments.find({
        "registrado_por": {"$in": asesor_ids},
        "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    total_cobrado = sum(p["monto"] for p in payments)
    
    cashbox_data = {
        "id": str(uuid.uuid4()),
        "fecha": today,
        "region": user.get("region", "general"),
        "asesor_id": None,
        "asesor_nombre": "CAJA REGIONAL",
        "tipo": "regional",
        "total_cobrado": total_cobrado,
        "numero_pagos": len(payments),
        "numero_asesores": len(asesores),
        "estatus": "cerrado",
        "cerrado_por": user["sub"],
        "cerrado_por_nombre": user["nombre"],
        "cerrado_fecha": datetime.now(timezone.utc).isoformat(),
        "notas": data.notas
    }
    
    await db.cashbox.insert_one(cashbox_data)
    
    await log_action(user["sub"], user["nombre"], "cerrar_caja_regional", "caja", cashbox_data["id"],
                    {"total": total_cobrado, "pagos": len(payments), "asesores": len(asesores)})
    
    return {
        "message": "Caja regional cerrada exitosamente",
        "total": total_cobrado,
        "pagos": len(payments),
        "asesores": len(asesores)
    }

# ============== FILE UPLOAD ROUTES ==============
@api_router.post("/upload")
async def upload_file(file: UploadFile = File(...), user: dict = Depends(get_current_user)):
    """Subir archivo (foto)"""
    # Generar nombre único
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOADS_DIR / filename
    
    # Guardar archivo
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Retornar URL relativa
    return {"url": f"/api/uploads/{filename}", "filename": filename}

# ============== STATS/DASHBOARD ROUTES ==============
@api_router.get("/stats/dashboard")
async def get_dashboard_stats(user: dict = Depends(get_current_user)):
    """Obtener estadísticas para el dashboard"""
    query = {}
    payment_query = {}
    is_regional = False
    
    if user["rol"] == "asesor":
        # Cartera personal del asesor
        query["asesor_id"] = user["sub"]
        payment_query["registrado_por"] = user["sub"]
    elif user["rol"] == "supervisor":
        # Cartera regional - todos los clientes/créditos de su región
        query["region"] = user["region"]
        payment_query["region"] = user["region"]
        is_regional = True
    elif user["rol"] == "gerente_regional":
        query["region"] = user["region"]
        payment_query["region"] = user["region"]
        is_regional = True
    
    # Contar clientes
    total_clientes = await db.clients.count_documents(query if query else {})
    
    # Contar créditos por estatus
    credit_query = query.copy()
    total_creditos = await db.credits.count_documents(credit_query if credit_query else {})
    
    creditos_vigentes = await db.credits.count_documents({**credit_query, "estatus": "vigente"})
    creditos_atrasados = await db.credits.count_documents({**credit_query, "estatus": "atrasado"})
    creditos_vencidos = await db.credits.count_documents({**credit_query, "estatus": "vencido"})
    creditos_pendientes = await db.credits.count_documents({**credit_query, "estatus": "pendiente"})
    
    # Calcular montos
    creditos = await db.credits.find(credit_query if credit_query else {}, {"_id": 0}).to_list(10000)
    monto_total_otorgado = sum(c.get("monto_otorgado", 0) for c in creditos)
    saldo_pendiente = sum(c.get("saldo_pendiente", 0) for c in creditos if c.get("estatus") in ["vigente", "atrasado"])
    
    # Pagos del día
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    today_payments = await db.payments.find({
        **payment_query,
        "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    cobro_hoy = sum(p["monto"] for p in today_payments)
    
    # Si es supervisor, obtener info de asesores
    asesores_count = 0
    if user["rol"] == "supervisor":
        asesores_count = await db.users.count_documents({
            "supervisor_id": user["sub"],
            "rol": "asesor",
            "activo": True
        })
    
    return {
        "total_clientes": total_clientes,
        "total_creditos": total_creditos,
        "creditos_vigentes": creditos_vigentes,
        "creditos_atrasados": creditos_atrasados,
        "creditos_vencidos": creditos_vencidos,
        "creditos_pendientes": creditos_pendientes,
        "monto_total_otorgado": monto_total_otorgado,
        "saldo_pendiente": saldo_pendiente,
        "cobro_hoy": cobro_hoy,
        "pagos_hoy": len(today_payments),
        "tipo_cartera": "regional" if is_regional else "personal",
        "asesores_count": asesores_count,
        "region": user.get("region")
    }

@api_router.get("/stats/cartera-regional")
async def get_cartera_regional(user: dict = Depends(get_current_user)):
    """Obtener estadísticas de cartera regional para supervisores"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    region = user.get("region")
    if not region and user["rol"] not in ["desarrollador", "administrador"]:
        raise HTTPException(status_code=400, detail="Usuario sin región asignada")
    
    # Obtener asesores de la región
    asesor_query = {"rol": "asesor", "activo": True}
    if user["rol"] == "supervisor":
        asesor_query["supervisor_id"] = user["sub"]
    elif region:
        asesor_query["region"] = region
    
    asesores = await db.users.find(asesor_query, {"_id": 0, "password": 0}).to_list(100)
    
    # Estadísticas por asesor
    asesores_stats = []
    total_regional = {
        "clientes": 0,
        "creditos_vigentes": 0,
        "saldo_pendiente": 0,
        "cobro_hoy": 0
    }
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    for asesor in asesores:
        clientes = await db.clients.count_documents({"asesor_id": asesor["id"]})
        creditos = await db.credits.find({"asesor_id": asesor["id"], "estatus": {"$in": ["vigente", "atrasado"]}}, {"_id": 0}).to_list(1000)
        saldo = sum(c.get("saldo_pendiente", 0) for c in creditos)
        
        pagos_hoy = await db.payments.find({
            "registrado_por": asesor["id"],
            "fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}
        }, {"_id": 0}).to_list(1000)
        cobro = sum(p["monto"] for p in pagos_hoy)
        
        asesores_stats.append({
            "id": asesor["id"],
            "nombre": asesor["nombre_completo"],
            "clientes": clientes,
            "creditos_activos": len(creditos),
            "saldo_pendiente": saldo,
            "cobro_hoy": cobro
        })
        
        total_regional["clientes"] += clientes
        total_regional["creditos_vigentes"] += len(creditos)
        total_regional["saldo_pendiente"] += saldo
        total_regional["cobro_hoy"] += cobro
    
    return {
        "region": region,
        "asesores": asesores_stats,
        "totales": total_regional
    }

@api_router.get("/stats/supervisor-dashboard")
async def get_supervisor_dashboard(user: dict = Depends(get_current_user)):
    """Dashboard en tiempo real para supervisores con métricas de rendimiento"""
    check_role(user, ["desarrollador", "administrador", "gerente_regional", "supervisor"])
    
    region = user.get("region")
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_start = datetime.strptime(today, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    today_end = today_start + timedelta(days=1)
    
    # Obtener asesores del supervisor
    asesor_query = {"rol": "asesor", "activo": True}
    if user["rol"] == "supervisor":
        asesor_query["supervisor_id"] = user["sub"]
    elif region:
        asesor_query["region"] = region
    
    asesores = await db.users.find(asesor_query, {"_id": 0}).to_list(100)
    asesor_ids = [a["id"] for a in asesores]
    
    # Métricas generales de rendimiento
    total_pagos_esperados_hoy = 0
    total_pagos_realizados_hoy = 0
    total_monto_esperado = 0
    total_monto_cobrado = 0
    
    # Alertas de cobranza del día
    alertas_hoy = []
    alertas_atrasadas = []
    
    # Obtener créditos activos de los asesores
    credit_query = {"estatus": {"$in": ["vigente", "atrasado"]}}
    if asesor_ids:
        credit_query["asesor_id"] = {"$in": asesor_ids}
    elif region:
        credit_query["region"] = region
    
    creditos = await db.credits.find(credit_query, {"_id": 0}).to_list(1000)
    
    for credito in creditos:
        for pago in credito.get("calendario_pagos", []):
            if pago["pagado"]:
                continue
            if pago["fecha"] == today:
                total_pagos_esperados_hoy += 1
                total_monto_esperado += pago["monto"]
                alertas_hoy.append({
                    "credito_id": credito["id"],
                    "cliente_nombre": credito["cliente_nombre"],
                    "monto": pago["monto"],
                    "tipo_credito": credito.get("tipo_credito", "diario")
                })
            elif pago["fecha"] < today:
                fecha_pago = datetime.strptime(pago["fecha"], "%Y-%m-%d")
                dias_atraso = (today_start.replace(tzinfo=None) - fecha_pago).days
                alertas_atrasadas.append({
                    "credito_id": credito["id"],
                    "cliente_nombre": credito["cliente_nombre"],
                    "monto": pago["monto"],
                    "dias_atraso": dias_atraso,
                    "tipo_credito": credito.get("tipo_credito", "diario")
                })
            break
    
    # Pagos realizados hoy
    payment_query = {"fecha_pago": {"$gte": today_start.isoformat(), "$lt": today_end.isoformat()}}
    if asesor_ids:
        payment_query["registrado_por"] = {"$in": asesor_ids}
    elif region:
        payment_query["region"] = region
    
    pagos_hoy = await db.payments.find(payment_query, {"_id": 0}).to_list(1000)
    total_pagos_realizados_hoy = len(pagos_hoy)
    total_monto_cobrado = sum(p["monto"] for p in pagos_hoy)
    
    # Calcular porcentaje de cobro
    porcentaje_cobro = 0
    if total_monto_esperado > 0:
        porcentaje_cobro = round((total_monto_cobrado / total_monto_esperado) * 100, 1)
    
    # Desembolsos pendientes de aprobación (créditos autorizados sin desembolsar)
    desembolsos_pendientes = await db.credits.find({
        "estatus": "autorizado",
        **({"region": region} if region else {})
    }, {"_id": 0}).to_list(100)
    
    # Rendimiento por asesor
    rendimiento_asesores = []
    for asesor in asesores:
        asesor_pagos = [p for p in pagos_hoy if p.get("registrado_por") == asesor["id"]]
        asesor_esperados = sum(1 for a in alertas_hoy + alertas_atrasadas 
                               for c in creditos 
                               if c["id"] == a["credito_id"] and c.get("asesor_id") == asesor["id"])
        
        rendimiento_asesores.append({
            "id": asesor["id"],
            "nombre": asesor["nombre_completo"],
            "region": asesor.get("region", ""),
            "pagos_realizados": len(asesor_pagos),
            "monto_cobrado": sum(p["monto"] for p in asesor_pagos),
            "alertas_pendientes": asesor_esperados
        })
    
    # Ordenar por monto cobrado
    rendimiento_asesores.sort(key=lambda x: x["monto_cobrado"], reverse=True)
    
    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metricas": {
            "pagos_esperados_hoy": total_pagos_esperados_hoy,
            "pagos_realizados_hoy": total_pagos_realizados_hoy,
            "monto_esperado_hoy": total_monto_esperado,
            "monto_cobrado_hoy": total_monto_cobrado,
            "porcentaje_cobro": porcentaje_cobro,
            "pagos_atrasados": len(alertas_atrasadas),
            "desembolsos_pendientes": len(desembolsos_pendientes)
        },
        "alertas": {
            "hoy": alertas_hoy[:10],
            "atrasados": sorted(alertas_atrasadas, key=lambda x: -x["dias_atraso"])[:10]
        },
        "desembolsos_pendientes": [{
            "id": d["id"],
            "cliente_nombre": d["cliente_nombre"],
            "monto": d["monto_otorgado"],
            "fecha_autorizacion": d.get("fecha_autorizacion", "")
        } for d in desembolsos_pendientes[:5]],
        "rendimiento_asesores": rendimiento_asesores,
        "region": region
    }

# ============== LOGS ROUTES ==============
@api_router.get("/logs")
async def get_logs(
    entidad: Optional[str] = None,
    usuario_id: Optional[str] = None,
    limit: int = 100,
    user: dict = Depends(get_current_user)
):
    """Obtener logs de auditoría - Solo desarrollador y administrador"""
    check_role(user, ["desarrollador", "administrador"])
    
    query = {}
    if entidad:
        query["entidad"] = entidad
    if usuario_id:
        query["usuario_id"] = usuario_id
    
    logs = await db.logs.find(query, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs

# ============== REGIONS ROUTES ==============
@api_router.get("/regions")
async def get_regions():
    """Obtener lista de regiones/localidades"""
    return LOCALIDADES

@api_router.get("/regions/structure")
async def get_regions_structure():
    """Obtener estructura jerárquica de regiones"""
    return {
        "sedes": REGIONS_STRUCTURE,
        "localidades": LOCALIDADES,
        "detalle": [
            {"id": "yajalon", "nombre": "Yajalón", "tipo": "sede_regional", "numero_region": 3},
            {"id": "chilon", "nombre": "Chilón", "tipo": "comunidad", "sede": "yajalon"},
            {"id": "bachajon", "nombre": "Bachajón", "tipo": "comunidad", "sede": "yajalon"},
            {"id": "temo", "nombre": "Temo", "tipo": "comunidad", "sede": "yajalon"},
            {"id": "petalcingo", "nombre": "Petalcingo", "tipo": "comunidad", "sede": "yajalon"},
            {"id": "tumbala", "nombre": "Tumbalá", "tipo": "comunidad", "sede": "yajalon"},
            {"id": "tila", "nombre": "Tila", "tipo": "comunidad", "sede": "yajalon"}
        ]
    }

@api_router.get("/roles")
async def get_roles():
    """Obtener lista de roles"""
    return ROLES

# ============== SEED DATA ==============
@api_router.post("/seed")
async def seed_data():
    """Crear datos iniciales (solo si no existen)"""
    # Verificar si ya existe el usuario desarrollador
    existing = await db.users.find_one({"username": "developer"})
    if existing:
        return {"message": "Datos ya inicializados"}
    
    # Crear usuario desarrollador
    dev_user = {
        "id": str(uuid.uuid4()),
        "username": "developer",
        "password": hash_password("developer123"),
        "nombre_completo": "Desarrollador Sistema",
        "rol": "desarrollador",
        "region": None,
        "telefono": None,
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(dev_user)
    
    # Crear usuario administrador
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "admin",
        "password": hash_password("admin123"),
        "nombre_completo": "Administrador General",
        "rol": "administrador",
        "region": None,
        "telefono": "9611234567",
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(admin_user)
    
    # Crear gerente regional de ejemplo
    gerente_user = {
        "id": str(uuid.uuid4()),
        "username": "gerente_yajalon",
        "password": hash_password("gerente123"),
        "nombre_completo": "Juan Pérez López",
        "rol": "gerente_regional",
        "region": "yajalon",
        "telefono": "9617654321",
        "activo": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(gerente_user)
    
    return {"message": "Datos iniciales creados", "users": ["developer", "admin", "gerente_yajalon"]}

# Include the router
app.include_router(api_router)

# Serve uploaded files
app.mount("/api/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
