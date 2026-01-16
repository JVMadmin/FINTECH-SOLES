import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  Eye,
  Filter,
  X,
  User,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOCALIDADES = [
  { id: "yajalon", nombre: "Yajalón (Sede Regional #3)", tipo: "sede" },
  { id: "chilon", nombre: "Chilón", tipo: "comunidad" },
  { id: "bachajon", nombre: "Bachajón", tipo: "comunidad" },
  { id: "temo", nombre: "Temo", tipo: "comunidad" },
  { id: "petalcingo", nombre: "Petalcingo", tipo: "comunidad" },
  { id: "tumbala", nombre: "Tumbalá", tipo: "comunidad" },
  { id: "tila", nombre: "Tila", tipo: "comunidad" },
];

export default function ClientsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocalidad, setFilterLocalidad] = useState("");
  const [filterEstatus, setFilterEstatus] = useState("");
  const [filterAsesor, setFilterAsesor] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newClient, setNewClient] = useState({
    nombre_completo: "",
    telefono: "",
    direccion: "",
    region: user?.region || "",
    referencias: [],
  });

  useEffect(() => {
    fetchClients();
    if (hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"])) {
      fetchAsesores();
    }
  }, [filterLocalidad, filterEstatus, filterAsesor]);

  const fetchClients = async () => {
    try {
      let url = `${API}/clients`;
      const params = new URLSearchParams();
      if (filterLocalidad) params.append("region", filterLocalidad);
      if (filterEstatus) params.append("estatus", filterEstatus);
      if (filterAsesor) params.append("asesor_id", filterAsesor);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url);
      setClients(response.data);
    } catch (error) {
      toast.error("Error al cargar clientes");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAsesores = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAsesores(response.data.filter(u => u.rol === "asesor" && u.activo));
    } catch (error) {
      console.error("Error fetching asesores:", error);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.nombre_completo || !newClient.telefono || !newClient.direccion || !newClient.region) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    try {
      const response = await axios.post(`${API}/clients`, newClient);
      toast.success("Cliente creado exitosamente");
      setIsDialogOpen(false);
      setNewClient({
        nombre_completo: "",
        telefono: "",
        direccion: "",
        region: user?.region || "",
        referencias: [],
      });
      fetchClients();
      navigate(`/clients/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear cliente");
    }
  };

  const getStatusBadge = (estatus) => {
    switch (estatus) {
      case "vigente":
        return <Badge className="status-vigente">Vigente</Badge>;
      case "atrasado":
        return <Badge className="status-atrasado">Atrasado</Badge>;
      case "vencido":
        return <Badge className="status-vencido">Vencido</Badge>;
      default:
        return <Badge className="status-pendiente">{estatus}</Badge>;
    }
  };

  const filteredClients = clients.filter((client) =>
    client.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.telefono.includes(searchTerm)
  );

  const clearFilters = () => {
    setFilterLocalidad("");
    setFilterEstatus("");
    setFilterAsesor("");
    setSearchTerm("");
  };

  const getLocalidadName = (id) => {
    const loc = LOCALIDADES.find(l => l.id === id);
    return loc ? loc.nombre : id;
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="clients-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Clientes
          </h1>
          <p className="text-gray-500 mt-1">{filteredClients.length} clientes encontrados</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-client-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl uppercase">Nuevo Cliente</DialogTitle>
              <DialogDescription>Ingrese los datos del nuevo cliente</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={newClient.nombre_completo}
                  onChange={(e) => setNewClient({ ...newClient, nombre_completo: e.target.value })}
                  placeholder="Nombre completo del cliente"
                  data-testid="client-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input
                  value={newClient.telefono}
                  onChange={(e) => setNewClient({ ...newClient, telefono: e.target.value })}
                  placeholder="Número de teléfono"
                  data-testid="client-phone-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Dirección *</Label>
                <Input
                  value={newClient.direccion}
                  onChange={(e) => setNewClient({ ...newClient, direccion: e.target.value })}
                  placeholder="Dirección completa"
                  data-testid="client-address-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Localidad *</Label>
                <Select
                  value={newClient.region}
                  onValueChange={(value) => setNewClient({ ...newClient, region: value })}
                  disabled={hasRole(["asesor", "supervisor", "gerente_regional"])}
                >
                  <SelectTrigger data-testid="client-region-select">
                    <SelectValue placeholder="Seleccionar localidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALIDADES.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.tipo === "sede" ? "📍 " : ""}{loc.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={handleCreateClient}
                data-testid="save-client-btn"
              >
                Guardar Cliente
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-clients"
                />
              </div>

              <Select value={filterEstatus || "all"} onValueChange={(v) => setFilterEstatus(v === "all" ? "" : v)}>
                <SelectTrigger className="w-full md:w-40" data-testid="filter-status">
                  <SelectValue placeholder="Todos los estatus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estatus</SelectItem>
                  <SelectItem value="vigente">Vigente</SelectItem>
                  <SelectItem value="atrasado">Atrasado</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtros adicionales para Admin/Gerente/Supervisor */}
            {hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"]) && (
              <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Filter className="w-4 h-4" />
                  <span>Filtros avanzados:</span>
                </div>
                
                <Select value={filterLocalidad || "all"} onValueChange={(v) => setFilterLocalidad(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full md:w-52" data-testid="filter-localidad">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Todas las localidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las localidades</SelectItem>
                    {LOCALIDADES.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.tipo === "sede" ? "📍 " : "  • "}{loc.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterAsesor || "all"} onValueChange={(v) => setFilterAsesor(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-full md:w-52" data-testid="filter-asesor">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <SelectValue placeholder="Todos los asesores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los asesores</SelectItem>
                    {asesores.map((asesor) => (
                      <SelectItem key={asesor.id} value={asesor.id}>
                        {asesor.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {(filterLocalidad || filterEstatus || filterAsesor || searchTerm) && (
              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpiar filtros
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Clients List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No se encontraron clientes</p>
            </CardContent>
          </Card>
        ) : (
          filteredClients.map((client) => (
            <Link key={client.id} to={`/clients/${client.id}`}>
              <Card className="card-interactive" data-testid={`client-card-${client.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{client.nombre_completo}</h3>
                        {getStatusBadge(client.estatus)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <Phone className="w-3 h-3" />
                        <a
                          href={`tel:${client.telefono}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-blue-600 hover:underline"
                        >
                          {client.telefono}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-3 h-3" />
                        <span className="capitalize">{client.region}</span>
                      </div>
                    </div>
                    <Eye className="w-5 h-5 text-gray-400" />
                  </div>
                  {client.asesor_nombre && (
                    <p className="text-xs text-gray-400 mt-2">
                      Asesor: {client.asesor_nombre}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Clients List - Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Región</TableHead>
                <TableHead>Asesor</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-pulse">Cargando...</div>
                  </TableCell>
                </TableRow>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron clientes
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/clients/${client.id}`)}
                    data-testid={`client-row-${client.id}`}
                  >
                    <TableCell>
                      <div className="font-medium">{client.nombre_completo}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {client.direccion}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`tel:${client.telefono}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {client.telefono}
                      </a>
                    </TableCell>
                    <TableCell className="capitalize">{client.region}</TableCell>
                    <TableCell>{client.asesor_nombre || "-"}</TableCell>
                    <TableCell>{getStatusBadge(client.estatus)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
