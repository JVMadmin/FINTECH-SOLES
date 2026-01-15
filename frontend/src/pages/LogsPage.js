import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  History,
  Search,
  User,
  Calendar,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ENTITIES = [
  { value: "", label: "Todas las entidades" },
  { value: "usuario", label: "Usuario" },
  { value: "cliente", label: "Cliente" },
  { value: "credito", label: "Crédito" },
  { value: "pago", label: "Pago" },
  { value: "caja", label: "Caja" },
  { value: "cartera", label: "Cartera" },
];

const ACTIONS = {
  login: { label: "Inicio de sesión", color: "bg-blue-100 text-blue-800" },
  crear_usuario: { label: "Crear usuario", color: "bg-green-100 text-green-800" },
  actualizar_usuario: { label: "Actualizar usuario", color: "bg-yellow-100 text-yellow-800" },
  desactivar_usuario: { label: "Desactivar usuario", color: "bg-red-100 text-red-800" },
  crear_cliente: { label: "Crear cliente", color: "bg-green-100 text-green-800" },
  actualizar_cliente: { label: "Actualizar cliente", color: "bg-yellow-100 text-yellow-800" },
  crear_credito: { label: "Crear crédito", color: "bg-green-100 text-green-800" },
  autorizar_credito: { label: "Autorizar crédito", color: "bg-purple-100 text-purple-800" },
  rechazar_credito: { label: "Rechazar crédito", color: "bg-red-100 text-red-800" },
  activar_credito: { label: "Activar crédito", color: "bg-blue-100 text-blue-800" },
  registrar_pago: { label: "Registrar pago", color: "bg-green-100 text-green-800" },
  cerrar_caja: { label: "Cerrar caja", color: "bg-purple-100 text-purple-800" },
  asignar_cartera: { label: "Asignar cartera", color: "bg-yellow-100 text-yellow-800" },
};

export default function LogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEntity, setFilterEntity] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [filterEntity]);

  const fetchLogs = async () => {
    try {
      let url = `${API}/logs?limit=200`;
      if (filterEntity) url += `&entidad=${filterEntity}`;
      
      const response = await axios.get(url);
      setLogs(response.data);
    } catch (error) {
      toast.error("Error al cargar logs");
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (accion) => {
    const config = ACTIONS[accion] || { label: accion, color: "bg-gray-100 text-gray-800" };
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString("es-MX"),
      time: date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    };
  };

  const filteredLogs = logs.filter((log) =>
    log.usuario_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.accion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in" data-testid="logs-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
          Auditoría
        </h1>
        <p className="text-gray-500 mt-1">
          Registro de todas las acciones del sistema
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuario o acción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-logs"
              />
            </div>
            <Select value={filterEntity} onValueChange={setFilterEntity}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Todas las entidades" />
              </SelectTrigger>
              <SelectContent>
                {ENTITIES.map((entity) => (
                  <SelectItem key={entity.value} value={entity.value}>
                    {entity.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <History className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Total Registros</p>
                <p className="font-heading text-2xl font-bold">{logs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <User className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Sesiones Hoy</p>
                <p className="font-heading text-2xl font-bold">
                  {logs.filter((l) => l.accion === "login" && l.timestamp.startsWith(new Date().toISOString().split("T")[0])).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Créditos Creados</p>
                <p className="font-heading text-2xl font-bold">
                  {logs.filter((l) => l.accion === "crear_credito").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-500">Pagos Registrados</p>
                <p className="font-heading text-2xl font-bold">
                  {logs.filter((l) => l.accion === "registrar_pago").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registro de Actividad</CardTitle>
          <CardDescription>{filteredLogs.length} registros</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-pulse">Cargando...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No se encontraron registros</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>Detalles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log, index) => {
                    const { date, time } = formatTimestamp(log.timestamp);
                    return (
                      <TableRow key={index} data-testid={`log-row-${index}`}>
                        <TableCell>
                          <div className="text-sm">
                            <p className="font-medium">{date}</p>
                            <p className="text-gray-500">{time}</p>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{log.usuario_nombre}</TableCell>
                        <TableCell>{getActionBadge(log.accion)}</TableCell>
                        <TableCell className="capitalize">{log.entidad}</TableCell>
                        <TableCell className="max-w-xs">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {JSON.stringify(log.detalles).substring(0, 50)}
                            {JSON.stringify(log.detalles).length > 50 ? "..." : ""}
                          </code>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
