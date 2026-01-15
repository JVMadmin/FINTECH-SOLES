import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  Users,
  UserCheck,
  ArrowRight,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CarteraPage() {
  const { user } = useAuth();
  const [unassignedClients, setUnassignedClients] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [selectedClients, setSelectedClients] = useState([]);
  const [selectedAsesor, setSelectedAsesor] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Para desarrollador/admin sin región, obtener todos los asesores
      const asesoresUrl = user?.region 
        ? `${API}/users/asesores/region/${user.region}`
        : `${API}/users/asesores/all`;
      
      const [clientsRes, asesoresRes] = await Promise.all([
        axios.get(`${API}/cartera/unassigned`),
        axios.get(asesoresUrl),
      ]);
      setUnassignedClients(clientsRes.data);
      setAsesores(asesoresRes.data);
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClient = (clientId) => {
    setSelectedClients((prev) =>
      prev.includes(clientId)
        ? prev.filter((id) => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedClients.length === filteredClients.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredClients.map((c) => c.id));
    }
  };

  const handleAssign = async () => {
    if (!selectedAsesor || selectedClients.length === 0) {
      toast.error("Seleccione al menos un cliente y un asesor");
      return;
    }

    try {
      await axios.post(`${API}/cartera/assign`, {
        cliente_ids: selectedClients,
        asesor_id: selectedAsesor,
      });
      
      toast.success(`${selectedClients.length} clientes asignados exitosamente`);
      setShowConfirmDialog(false);
      setSelectedClients([]);
      setSelectedAsesor("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al asignar cartera");
    }
  };

  const filteredClients = unassignedClients.filter((client) =>
    client.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedAsesorData = asesores.find((a) => a.id === selectedAsesor);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="cartera-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Asignación de Cartera
          </h1>
          <p className="text-gray-500 mt-1">
            {unassignedClients.length} clientes sin asignar
            {user?.region && ` en ${user.region}`}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sin Asignar</p>
                <p className="font-heading text-2xl font-bold">{unassignedClients.length}</p>
              </div>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Asesores Activos</p>
                <p className="font-heading text-2xl font-bold">{asesores.length}</p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Seleccionados</p>
                <p className="font-heading text-2xl font-bold text-yellow-600">
                  {selectedClients.length}
                </p>
              </div>
              <Briefcase className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assignment Panel */}
      {selectedClients.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-yellow-600 text-white text-lg px-3 py-1">
                  {selectedClients.length}
                </Badge>
                <span className="font-medium">clientes seleccionados</span>
              </div>
              
              <div className="flex items-center gap-3">
                <ArrowRight className="w-5 h-5 text-gray-400 hidden md:block" />
                
                <Select value={selectedAsesor} onValueChange={setSelectedAsesor}>
                  <SelectTrigger className="w-64" data-testid="select-asesor">
                    <SelectValue placeholder="Seleccionar asesor" />
                  </SelectTrigger>
                  <SelectContent>
                    {asesores.map((asesor) => (
                      <SelectItem key={asesor.id} value={asesor.id}>
                        {asesor.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  className="bg-yellow-600 hover:bg-yellow-700"
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={!selectedAsesor}
                  data-testid="assign-btn"
                >
                  Asignar Cartera
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar clientes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="search-clients"
        />
      </div>

      {/* Clients Table */}
      <Card>
        <CardContent className="p-0">
          {filteredClients.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">
                {unassignedClients.length === 0
                  ? "Todos los clientes tienen asesor asignado"
                  : "No se encontraron clientes"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                      onCheckedChange={handleSelectAll}
                      data-testid="select-all-checkbox"
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Región</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow
                    key={client.id}
                    className={`table-row-hover ${
                      selectedClients.includes(client.id) ? "bg-yellow-50" : ""
                    }`}
                    data-testid={`client-row-${client.id}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => handleSelectClient(client.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{client.nombre_completo}</TableCell>
                    <TableCell>{client.telefono}</TableCell>
                    <TableCell className="max-w-xs truncate">{client.direccion}</TableCell>
                    <TableCell className="capitalize">{client.region}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Confirmar Asignación
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                ¿Está seguro de asignar <strong>{selectedClients.length}</strong> clientes
                al asesor <strong>{selectedAsesorData?.nombre_completo}</strong>?
              </p>
              <p className="text-sm text-gray-500">
                Esta acción asignará los clientes seleccionados a la cartera del asesor.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={handleAssign}
            >
              Confirmar Asignación
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
