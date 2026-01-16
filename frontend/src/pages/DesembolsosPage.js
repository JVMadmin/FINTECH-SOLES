import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Banknote,
  Plus,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  DollarSign,
  RefreshCw,
  Eye,
  Play,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CREDIT_TYPES = [
  { value: "diario", label: "Diario (Lunes a Viernes)" },
  { value: "semanal", label: "Semanal" },
  { value: "catorcenal", label: "Catorcenal" },
];

export default function DesembolsosPage() {
  const { user, hasRole } = useAuth();
  const [disbursements, setDisbursements] = useState([]);
  const [pendingDisbursements, setPendingDisbursements] = useState([]);
  const [scheduledDisbursements, setScheduledDisbursements] = useState([]);
  const [clients, setClients] = useState([]);
  const [clientCredits, setClientCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDisbursement, setSelectedDisbursement] = useState(null);
  const [actionType, setActionType] = useState(null); // approve, reject, execute
  const [rejectReason, setRejectReason] = useState("");
  
  const [newDisbursement, setNewDisbursement] = useState({
    cliente_id: "",
    monto: "",
    tipo_credito: "diario",
    plazo: "",
    fecha_desembolso: "",
    es_renovacion: false,
    credito_anterior_id: "",
    notas: "",
  });

  const canApprove = hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const promises = [
        axios.get(`${API}/disbursements`),
        axios.get(`${API}/clients`),
      ];
      
      if (canApprove) {
        promises.push(axios.get(`${API}/disbursements/pending`));
        promises.push(axios.get(`${API}/disbursements/scheduled`));
      }
      
      const results = await Promise.all(promises);
      setDisbursements(results[0].data);
      setClients(results[1].data);
      
      if (canApprove && results[2]) {
        setPendingDisbursements(results[2].data);
      }
      if (canApprove && results[3]) {
        setScheduledDisbursements(results[3].data);
      }
    } catch (error) {
      toast.error("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClientChange = async (clientId) => {
    setNewDisbursement({ ...newDisbursement, cliente_id: clientId, credito_anterior_id: "" });
    
    if (clientId) {
      try {
        const response = await axios.get(`${API}/credits?cliente_id=${clientId}`);
        setClientCredits(response.data);
      } catch (error) {
        console.error("Error fetching client credits:", error);
      }
    } else {
      setClientCredits([]);
    }
  };

  const handleSubmit = async () => {
    if (!newDisbursement.cliente_id || !newDisbursement.monto || !newDisbursement.plazo || !newDisbursement.fecha_desembolso) {
      toast.error("Complete todos los campos requeridos");
      return;
    }

    try {
      await axios.post(`${API}/disbursements`, {
        ...newDisbursement,
        monto: parseFloat(newDisbursement.monto),
        plazo: parseInt(newDisbursement.plazo),
      });
      toast.success("Solicitud de desembolso creada");
      setIsDialogOpen(false);
      setNewDisbursement({
        cliente_id: "",
        monto: "",
        tipo_credito: "diario",
        plazo: "",
        fecha_desembolso: "",
        es_renovacion: false,
        credito_anterior_id: "",
        notas: "",
      });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear solicitud");
    }
  };

  const handleApprove = async () => {
    try {
      await axios.post(`${API}/disbursements/${selectedDisbursement.id}/approve`);
      toast.success("Desembolso aprobado");
      setSelectedDisbursement(null);
      setActionType(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al aprobar");
    }
  };

  const handleReject = async () => {
    try {
      await axios.post(`${API}/disbursements/${selectedDisbursement.id}/reject?motivo=${encodeURIComponent(rejectReason)}`);
      toast.success("Desembolso rechazado");
      setSelectedDisbursement(null);
      setActionType(null);
      setRejectReason("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al rechazar");
    }
  };

  const handleExecute = async () => {
    try {
      await axios.post(`${API}/disbursements/${selectedDisbursement.id}/execute`);
      toast.success("Desembolso ejecutado - Crédito creado");
      setSelectedDisbursement(null);
      setActionType(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al ejecutar");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const getStatusBadge = (estatus) => {
    const statuses = {
      pendiente: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
      aprobado: { label: "Aprobado", color: "bg-green-100 text-green-800", icon: CheckCircle },
      rechazado: { label: "Rechazado", color: "bg-red-100 text-red-800", icon: XCircle },
      ejecutado: { label: "Ejecutado", color: "bg-blue-100 text-blue-800", icon: Play },
    };
    const status = statuses[estatus] || statuses.pendiente;
    const Icon = status.icon;
    return (
      <Badge className={status.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status.label}
      </Badge>
    );
  };

  const liquidatedCredits = clientCredits.filter(c => c.estatus === "liquidado");
  const activeCredits = clientCredits.filter(c => ["vigente", "atrasado", "pendiente", "autorizado"].includes(c.estatus));

  // Get minimum date (today)
  const today = new Date().toISOString().split("T")[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="desembolsos-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Desembolsos Programados
          </h1>
          <p className="text-gray-500 mt-1">
            Gestión de solicitudes y programación de desembolsos
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700" data-testid="new-disbursement-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <Banknote className="w-5 h-5 text-green-600" />
                Solicitar Desembolso
              </DialogTitle>
              <DialogDescription>
                Programe un desembolso para un cliente
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={newDisbursement.cliente_id}
                  onValueChange={handleClientChange}
                >
                  <SelectTrigger data-testid="select-client">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nombre_completo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newDisbursement.cliente_id && activeCredits.length > 0 && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-800">
                    <AlertTriangle className="w-4 h-4" />
                    <p className="text-sm font-medium">Cliente con crédito activo</p>
                  </div>
                  <p className="text-xs text-orange-600 mt-1">
                    Debe liquidar el crédito actual para solicitar uno nuevo.
                  </p>
                </div>
              )}

              {newDisbursement.cliente_id && liquidatedCredits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="es_renovacion"
                      checked={newDisbursement.es_renovacion}
                      onChange={(e) => setNewDisbursement({
                        ...newDisbursement,
                        es_renovacion: e.target.checked,
                        credito_anterior_id: e.target.checked ? liquidatedCredits[0]?.id : ""
                      })}
                      className="rounded"
                    />
                    <Label htmlFor="es_renovacion" className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-600" />
                      Es renovación de crédito
                    </Label>
                  </div>
                  
                  {newDisbursement.es_renovacion && (
                    <Select
                      value={newDisbursement.credito_anterior_id}
                      onValueChange={(v) => setNewDisbursement({ ...newDisbursement, credito_anterior_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar crédito liquidado" />
                      </SelectTrigger>
                      <SelectContent>
                        {liquidatedCredits.map((credit) => (
                          <SelectItem key={credit.id} value={credit.id}>
                            {formatCurrency(credit.monto_otorgado)} - Liquidado
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto *</Label>
                  <Input
                    type="number"
                    value={newDisbursement.monto}
                    onChange={(e) => setNewDisbursement({ ...newDisbursement, monto: e.target.value })}
                    placeholder="5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Plazo (pagos) *</Label>
                  <Input
                    type="number"
                    value={newDisbursement.plazo}
                    onChange={(e) => setNewDisbursement({ ...newDisbursement, plazo: e.target.value })}
                    placeholder="20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Crédito *</Label>
                  <Select
                    value={newDisbursement.tipo_credito}
                    onValueChange={(v) => setNewDisbursement({ ...newDisbursement, tipo_credito: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CREDIT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Fecha de Desembolso *</Label>
                  <Input
                    type="date"
                    value={newDisbursement.fecha_desembolso}
                    onChange={(e) => setNewDisbursement({ ...newDisbursement, fecha_desembolso: e.target.value })}
                    min={today}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={newDisbursement.notas}
                  onChange={(e) => setNewDisbursement({ ...newDisbursement, notas: e.target.value })}
                  placeholder="Observaciones adicionales..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={handleSubmit}
                disabled={activeCredits.length > 0 && !newDisbursement.es_renovacion}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Enviar Solicitud
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue={canApprove ? "pendientes" : "mis-solicitudes"}>
        <TabsList>
          {canApprove && (
            <>
              <TabsTrigger value="pendientes" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Pendientes
                {pendingDisbursements.length > 0 && (
                  <Badge className="bg-yellow-600 text-white ml-1">{pendingDisbursements.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="programados" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Programados
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="mis-solicitudes" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            {canApprove ? "Todas" : "Mis Solicitudes"}
          </TabsTrigger>
        </TabsList>

        {/* Pending Disbursements */}
        {canApprove && (
          <TabsContent value="pendientes">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Solicitudes Pendientes de Aprobación</CardTitle>
                <CardDescription>Revise y apruebe o rechace las solicitudes</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingDisbursements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                    <p>No hay solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingDisbursements.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                        data-testid={`pending-${d.id}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{d.cliente_nombre}</h3>
                              {d.es_renovacion && (
                                <Badge className="bg-blue-100 text-blue-800">
                                  <RefreshCw className="w-3 h-3 mr-1" />
                                  Renovación
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(d.monto)} • {d.tipo_credito} • {d.plazo} pagos
                            </p>
                            <p className="text-sm text-gray-500">
                              Fecha programada: <strong>{d.fecha_desembolso}</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Solicitado por {d.solicitado_por_nombre} el {d.fecha_solicitud?.split("T")[0]}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedDisbursement(d);
                                setActionType("approve");
                              }}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => {
                                setSelectedDisbursement(d);
                                setActionType("reject");
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rechazar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Scheduled Disbursements */}
        {canApprove && (
          <TabsContent value="programados">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Desembolsos Programados (Próximos 7 días)</CardTitle>
                <CardDescription>Desembolsos aprobados pendientes de ejecución</CardDescription>
              </CardHeader>
              <CardContent>
                {scheduledDisbursements.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No hay desembolsos programados</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scheduledDisbursements.map((d) => (
                      <div
                        key={d.id}
                        className="p-4 border rounded-lg bg-green-50 border-green-200"
                        data-testid={`scheduled-${d.id}`}
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium">{d.cliente_nombre}</h3>
                              <Badge className="bg-green-100 text-green-800">Aprobado</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(d.monto)} • {d.tipo_credito} • {d.plazo} pagos
                            </p>
                            <p className="text-sm font-medium text-green-700">
                              <Calendar className="w-4 h-4 inline mr-1" />
                              Fecha de desembolso: {d.fecha_desembolso}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => {
                              setSelectedDisbursement(d);
                              setActionType("execute");
                            }}
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Ejecutar Desembolso
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* All Disbursements */}
        <TabsContent value="mis-solicitudes">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {canApprove ? "Todas las Solicitudes" : "Mis Solicitudes"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {disbursements.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Banknote className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p>No hay solicitudes de desembolso</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fecha Desembolso</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Solicitante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disbursements.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{d.cliente_nombre}</span>
                            {d.es_renovacion && (
                              <RefreshCw className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {formatCurrency(d.monto)}
                        </TableCell>
                        <TableCell className="capitalize">{d.tipo_credito}</TableCell>
                        <TableCell>{d.fecha_desembolso}</TableCell>
                        <TableCell>{getStatusBadge(d.estatus)}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {d.solicitado_por_nombre}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={actionType === "approve"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Aprobar Desembolso
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">¿Confirma la aprobación de este desembolso?</p>
              <div className="p-4 bg-green-50 rounded-lg">
                <p className="font-medium">{selectedDisbursement?.cliente_nombre}</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(selectedDisbursement?.monto)}
                </p>
                <p className="text-sm text-gray-600">
                  Programado para: {selectedDisbursement?.fecha_desembolso}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
            >
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={actionType === "reject"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rechazar Desembolso
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">¿Confirma el rechazo de esta solicitud?</p>
              <div className="p-4 bg-red-50 rounded-lg mb-4">
                <p className="font-medium">{selectedDisbursement?.cliente_nombre}</p>
                <p className="text-lg font-bold text-red-600">
                  {formatCurrency(selectedDisbursement?.monto)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Motivo del rechazo</Label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Indique el motivo..."
                  rows={2}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
            >
              Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Execute Dialog */}
      <AlertDialog open={actionType === "execute"} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              Ejecutar Desembolso
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Al ejecutar este desembolso se creará el crédito para el cliente.
              </p>
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="font-medium">{selectedDisbursement?.cliente_nombre}</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(selectedDisbursement?.monto)}
                </p>
                <p className="text-sm text-gray-600">
                  {selectedDisbursement?.tipo_credito} • {selectedDisbursement?.plazo} pagos
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleExecute}
            >
              <Play className="w-4 h-4 mr-2" />
              Ejecutar y Crear Crédito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
