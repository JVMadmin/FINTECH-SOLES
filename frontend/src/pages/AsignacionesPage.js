import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  UserCheck,
  Users,
  MapPin,
  Link as LinkIcon,
  Plus,
  Building,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REGIONS = [
  { id: "yajalon", nombre: "Yajalón (Sede Regional #3)", tipo: "sede" },
  { id: "chilon", nombre: "Chilón", tipo: "comunidad" },
  { id: "bachajon", nombre: "Bachajón", tipo: "comunidad" },
  { id: "temo", nombre: "Temo", tipo: "comunidad" },
  { id: "petalcingo", nombre: "Petalcingo", tipo: "comunidad" },
  { id: "tumbala", nombre: "Tumbalá", tipo: "comunidad" },
  { id: "tila", nombre: "Tila", tipo: "comunidad" },
];

export default function AsignacionesPage() {
  const { user, hasRole } = useAuth();
  const [supervisors, setSupervisors] = useState([]);
  const [unassignedAsesores, setUnassignedAsesores] = useState([]);
  const [myAsesores, setMyAsesores] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog states
  const [showAssignSupervisorDialog, setShowAssignSupervisorDialog] = useState(false);
  const [showAssignAsesorDialog, setShowAssignAsesorDialog] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("");
  const [selectedAsesor, setSelectedAsesor] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes] = await Promise.all([
        axios.get(`${API}/users`),
      ]);
      
      setAllUsers(usersRes.data);
      setSupervisors(usersRes.data.filter(u => u.rol === "supervisor"));
      
      // Obtener asesores sin asignar
      try {
        const unassignedRes = await axios.get(`${API}/users/unassigned-asesores`);
        setUnassignedAsesores(unassignedRes.data);
      } catch (e) {
        console.error("Error loading unassigned:", e);
      }
      
      // Si es supervisor, obtener sus asesores
      if (user?.rol === "supervisor") {
        try {
          const myAsesoresRes = await axios.get(`${API}/users/my-asesores`);
          setMyAsesores(myAsesoresRes.data);
        } catch (e) {
          console.error("Error loading my asesores:", e);
        }
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignSupervisorToRegion = async () => {
    if (!selectedSupervisor || !selectedRegion) {
      toast.error("Seleccione un supervisor y una región");
      return;
    }

    try {
      await axios.post(`${API}/users/assign-supervisor`, {
        supervisor_id: selectedSupervisor,
        region: selectedRegion,
      });
      toast.success("Supervisor asignado a la región");
      setShowAssignSupervisorDialog(false);
      setSelectedSupervisor("");
      setSelectedRegion("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al asignar");
    }
  };

  const handleAssignAsesorToSupervisor = async () => {
    if (!selectedAsesor) {
      toast.error("Seleccione un asesor");
      return;
    }

    const supervisorId = user?.rol === "supervisor" ? user.id : selectedSupervisor;
    
    if (!supervisorId) {
      toast.error("Seleccione un supervisor");
      return;
    }

    try {
      await axios.post(`${API}/users/assign-asesor`, {
        asesor_id: selectedAsesor,
        supervisor_id: supervisorId,
      });
      toast.success("Asesor asignado correctamente");
      setShowAssignAsesorDialog(false);
      setSelectedAsesor("");
      setSelectedSupervisor("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al asignar");
    }
  };

  const getRegionName = (regionId) => {
    const region = REGIONS.find(r => r.id === regionId);
    return region ? region.nombre : regionId || "Sin asignar";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="asignaciones-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Asignaciones
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de supervisores y asesores por región
          </p>
        </div>
      </div>

      {/* Asignar Supervisor a Región - Solo para Gerente/Admin/Dev */}
      {hasRole(["desarrollador", "administrador", "gerente_regional"]) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  Supervisores por Región
                </CardTitle>
                <CardDescription>Asigne supervisores a las diferentes zonas</CardDescription>
              </div>
              <Dialog open={showAssignSupervisorDialog} onOpenChange={setShowAssignSupervisorDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-purple-600 hover:bg-purple-700" data-testid="assign-supervisor-btn">
                    <Plus className="w-4 h-4 mr-2" />
                    Asignar Supervisor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Asignar Supervisor a Región</DialogTitle>
                    <DialogDescription>
                      Seleccione el supervisor y la región a la que será asignado
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Supervisor</label>
                      <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar supervisor" />
                        </SelectTrigger>
                        <SelectContent>
                          {supervisors.map((sup) => (
                            <SelectItem key={sup.id} value={sup.id}>
                              {sup.nombre_completo} {sup.region && `(${sup.region})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Región</label>
                      <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar región" />
                        </SelectTrigger>
                        <SelectContent>
                          {REGIONS.map((region) => (
                            <SelectItem key={region.id} value={region.id}>
                              {region.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAssignSupervisorDialog(false)}>
                      Cancelar
                    </Button>
                    <Button className="bg-purple-600 hover:bg-purple-700" onClick={handleAssignSupervisorToRegion}>
                      Asignar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supervisor</TableHead>
                  <TableHead>Región Asignada</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supervisors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      No hay supervisores registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  supervisors.map((sup) => (
                    <TableRow key={sup.id}>
                      <TableCell className="font-medium">{sup.nombre_completo}</TableCell>
                      <TableCell>
                        {sup.region ? (
                          <Badge className="bg-purple-100 text-purple-800">
                            <MapPin className="w-3 h-3 mr-1" />
                            {getRegionName(sup.region)}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">Sin asignar</Badge>
                        )}
                      </TableCell>
                      <TableCell>{sup.telefono || "-"}</TableCell>
                      <TableCell>
                        {sup.activo ? (
                          <Badge className="bg-green-100 text-green-800">Activo</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Asignar Asesores - Para Supervisores */}
      {hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"]) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-yellow-600" />
                  {user?.rol === "supervisor" ? "Mis Asesores" : "Asesores por Supervisor"}
                </CardTitle>
                <CardDescription>
                  {user?.rol === "supervisor" 
                    ? "Asesores asignados a tu supervisión" 
                    : "Gestione la asignación de asesores a supervisores"}
                </CardDescription>
              </div>
              {unassignedAsesores.length > 0 && (
                <Dialog open={showAssignAsesorDialog} onOpenChange={setShowAssignAsesorDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="assign-asesor-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Asignar Asesor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Asignar Asesor</DialogTitle>
                      <DialogDescription>
                        {user?.rol === "supervisor" 
                          ? "Seleccione el asesor que desea agregar a su equipo"
                          : "Seleccione el asesor y el supervisor al que será asignado"}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Asesor sin asignar</label>
                        <Select value={selectedAsesor} onValueChange={setSelectedAsesor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar asesor" />
                          </SelectTrigger>
                          <SelectContent>
                            {unassignedAsesores.map((asesor) => (
                              <SelectItem key={asesor.id} value={asesor.id}>
                                {asesor.nombre_completo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {user?.rol !== "supervisor" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Supervisor</label>
                          <Select value={selectedSupervisor} onValueChange={setSelectedSupervisor}>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar supervisor" />
                            </SelectTrigger>
                            <SelectContent>
                              {supervisors.filter(s => s.region).map((sup) => (
                                <SelectItem key={sup.id} value={sup.id}>
                                  {sup.nombre_completo} ({sup.region})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAssignAsesorDialog(false)}>
                        Cancelar
                      </Button>
                      <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleAssignAsesorToSupervisor}>
                        Asignar
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {user?.rol === "supervisor" ? (
              // Vista de supervisor - solo sus asesores
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asesor</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myAsesores.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                        No tienes asesores asignados
                      </TableCell>
                    </TableRow>
                  ) : (
                    myAsesores.map((asesor) => (
                      <TableRow key={asesor.id}>
                        <TableCell className="font-medium">{asesor.nombre_completo}</TableCell>
                        <TableCell>{asesor.telefono || "-"}</TableCell>
                        <TableCell>
                          {asesor.activo ? (
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            ) : (
              // Vista de admin - todos los asesores agrupados por supervisor
              <div className="space-y-6">
                {supervisors.filter(s => s.region).map((supervisor) => {
                  const asesoresDelSupervisor = allUsers.filter(
                    u => u.rol === "asesor" && u.supervisor_id === supervisor.id
                  );
                  
                  return (
                    <div key={supervisor.id} className="border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <UserCheck className="w-5 h-5 text-purple-600" />
                        <span className="font-medium">{supervisor.nombre_completo}</span>
                        <Badge className="bg-purple-100 text-purple-800">{supervisor.region}</Badge>
                        <Badge variant="outline">{asesoresDelSupervisor.length} asesores</Badge>
                      </div>
                      {asesoresDelSupervisor.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {asesoresDelSupervisor.map((asesor) => (
                            <div key={asesor.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                              <Users className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{asesor.nombre_completo}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">Sin asesores asignados</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Asesores sin asignar */}
      {unassignedAsesores.length > 0 && hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"]) && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
              <Users className="w-5 h-5" />
              Asesores sin Supervisor ({unassignedAsesores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {unassignedAsesores.map((asesor) => (
                <div key={asesor.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div>
                    <p className="font-medium">{asesor.nombre_completo}</p>
                    <p className="text-sm text-gray-500">{asesor.telefono || "Sin teléfono"}</p>
                  </div>
                  <Badge variant="outline" className="text-yellow-600">Pendiente</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
