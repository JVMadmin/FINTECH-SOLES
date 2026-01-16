import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Receipt,
  DollarSign,
  Calendar,
  Lock,
  CheckCircle,
  Clock,
  FileText,
  User,
  MapPin,
  Filter,
  X,
  Users,
  AlertTriangle,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOCALIDADES = [
  { id: "yajalon", nombre: "Yajalón (Sede Regional #3)" },
  { id: "chilon", nombre: "Chilón" },
  { id: "bachajon", nombre: "Bachajón" },
  { id: "temo", nombre: "Temo" },
  { id: "petalcingo", nombre: "Petalcingo" },
  { id: "tumbala", nombre: "Tumbalá" },
  { id: "tila", nombre: "Tila" },
];

export default function CashboxPage() {
  const { user, hasRole } = useAuth();
  const [todayCashbox, setTodayCashbox] = useState(null);
  const [regionalCashbox, setRegionalCashbox] = useState(null);
  const [asesoresStatus, setAsesoresStatus] = useState(null);
  const [history, setHistory] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [showCloseRegionalDialog, setShowCloseRegionalDialog] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");
  
  // Filters
  const [filterAsesor, setFilterAsesor] = useState("");
  const [filterLocalidad, setFilterLocalidad] = useState("");
  const [expandedAsesor, setExpandedAsesor] = useState("");

  const isRegionalView = hasRole(["desarrollador", "administrador", "gerente_regional", "supervisor"]);

  useEffect(() => {
    fetchData();
  }, [filterAsesor, filterLocalidad]);

  const fetchData = async () => {
    try {
      const promises = [
        axios.get(`${API}/cashbox/today`),
        axios.get(`${API}/cashbox/history`),
      ];
      
      // Agregar endpoints regionales si tiene permisos
      if (isRegionalView) {
        let regionalUrl = `${API}/cashbox/regional`;
        const params = new URLSearchParams();
        if (filterAsesor) params.append("asesor_id", filterAsesor);
        if (filterLocalidad) params.append("localidad", filterLocalidad);
        if (params.toString()) regionalUrl += `?${params.toString()}`;
        promises.push(axios.get(regionalUrl));
        
        // Obtener estado de cierres de asesores
        promises.push(axios.get(`${API}/cashbox/asesores-status`));
        
        // Obtener lista de asesores para el filtro
        promises.push(axios.get(`${API}/users`));
      }
      
      const results = await Promise.all(promises);
      setTodayCashbox(results[0].data);
      setHistory(results[1].data);
      
      if (isRegionalView && results[2]) {
        setRegionalCashbox(results[2].data);
      }
      if (isRegionalView && results[3]) {
        setAsesoresStatus(results[3].data);
      }
      if (isRegionalView && results[4]) {
        setAsesores(results[4].data.filter(u => u.rol === "asesor" && u.activo));
      }
    } catch (error) {
      toast.error("Error al cargar datos de caja");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseCashbox = async () => {
    try {
      await axios.post(`${API}/cashbox/close`, { notas: closeNotes });
      toast.success("Caja cerrada exitosamente");
      setShowCloseDialog(false);
      setCloseNotes("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al cerrar caja");
    }
  };

  const handleCloseRegionalCashbox = async () => {
    try {
      await axios.post(`${API}/cashbox/close-regional`, { notas: closeNotes });
      toast.success("Caja regional cerrada exitosamente");
      setShowCloseRegionalDialog(false);
      setCloseNotes("");
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al cerrar caja regional");
    }
  };

  const clearFilters = () => {
    setFilterAsesor("");
    setFilterLocalidad("");
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const getLocalidadName = (id) => {
    const loc = LOCALIDADES.find(l => l.id === id);
    return loc ? loc.nombre : id || "Sin asignar";
  };

  const today = new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  const porcentajeCierres = asesoresStatus?.resumen 
    ? (asesoresStatus.resumen.asesores_cerrados / asesoresStatus.resumen.total_asesores) * 100 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="cashbox-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            {isRegionalView ? "Caja Regional" : "Mi Caja"}
          </h1>
          <p className="text-gray-500 mt-1 capitalize">{today}</p>
        </div>

        <div className="flex gap-2">
          {/* Botón para cerrar caja personal (asesor) */}
          {!isRegionalView && todayCashbox?.estatus !== "cerrado" && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => setShowCloseDialog(true)}
              data-testid="close-cashbox-btn"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cerrar Mi Caja
            </Button>
          )}
          
          {/* Botón para cerrar caja regional (supervisor) */}
          {isRegionalView && asesoresStatus && !asesoresStatus.caja_regional_cerrada && (
            <Button
              className={`${asesoresStatus.puede_cerrar_regional 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-gray-400 cursor-not-allowed"}`}
              onClick={() => asesoresStatus.puede_cerrar_regional && setShowCloseRegionalDialog(true)}
              disabled={!asesoresStatus.puede_cerrar_regional}
              data-testid="close-regional-btn"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cerrar Caja Regional
            </Button>
          )}
        </div>
      </div>

      {/* Estado de Cierres de Asesores (Solo Supervisor) */}
      {isRegionalView && asesoresStatus && (
        <Card className={`border-2 ${
          asesoresStatus.caja_regional_cerrada 
            ? "border-green-300 bg-green-50" 
            : asesoresStatus.puede_cerrar_regional 
              ? "border-yellow-300 bg-yellow-50" 
              : "border-orange-300 bg-orange-50"
        }`}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <Users className="w-5 h-5" />
                Estado de Cierres del Día
              </CardTitle>
              {asesoresStatus.caja_regional_cerrada ? (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Regional Cerrada ({asesoresStatus.hora_cierre_regional})
                </Badge>
              ) : asesoresStatus.puede_cerrar_regional ? (
                <Badge className="bg-yellow-600 text-white animate-pulse">
                  <Lock className="w-4 h-4 mr-1" />
                  Listo para Cerrar
                </Badge>
              ) : (
                <Badge className="bg-orange-600 text-white">
                  <Clock className="w-4 h-4 mr-1" />
                  Esperando Asesores
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Progreso de cierres</span>
                <span className="font-bold">
                  {asesoresStatus.resumen.asesores_cerrados} / {asesoresStatus.resumen.total_asesores} asesores
                </span>
              </div>
              <Progress value={porcentajeCierres} className="h-3" />
            </div>

            {/* Lista de Asesores con Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
              {asesoresStatus.asesores.map((asesor) => (
                <div
                  key={asesor.asesor_id}
                  className={`p-3 rounded-lg border ${
                    asesor.caja_cerrada 
                      ? "bg-green-50 border-green-200" 
                      : "bg-white border-orange-200"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        asesor.caja_cerrada ? "bg-green-200" : "bg-orange-200"
                      }`}>
                        {asesor.caja_cerrada ? (
                          <CheckCircle className="w-4 h-4 text-green-700" />
                        ) : (
                          <Unlock className="w-4 h-4 text-orange-700" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{asesor.asesor_nombre}</p>
                        <p className="text-xs text-gray-500">{getLocalidadName(asesor.region)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600 text-sm">
                        {formatCurrency(asesor.total_cobrado)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {asesor.caja_cerrada 
                          ? `Cerrada ${asesor.hora_cierre}` 
                          : `${asesor.numero_pagos} pagos`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen */}
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(asesoresStatus.resumen.total_cobrado_regional)}
                  </p>
                  <p className="text-xs text-gray-500">Total Cobrado Regional</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {asesoresStatus.resumen.total_pagos_regional}
                  </p>
                  <p className="text-xs text-gray-500">Pagos Registrados</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${
                    asesoresStatus.resumen.asesores_pendientes === 0 
                      ? "text-green-600" 
                      : "text-orange-600"
                  }`}>
                    {asesoresStatus.resumen.asesores_pendientes}
                  </p>
                  <p className="text-xs text-gray-500">Pendientes de Cerrar</p>
                </div>
              </div>
            </div>

            {!asesoresStatus.puede_cerrar_regional && !asesoresStatus.caja_regional_cerrada && (
              <div className="mt-4 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                <div className="flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="w-5 h-5" />
                  <p className="text-sm">
                    <strong>Esperando cierres:</strong> {asesoresStatus.resumen.asesores_pendientes} asesor(es) 
                    aún no han cerrado su caja. Debe esperar a que todos cierren para cerrar la caja regional.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Filters for Regional View */}
      {isRegionalView && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Filtrar cobros por:</span>
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
                      {loc.nombre}
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

              {(filterAsesor || filterLocalidad) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="w-4 h-4 mr-1" />
                  Limpiar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cobros por Asesor (Regional View) */}
      {isRegionalView && regionalCashbox?.asesores?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Detalle de Cobros por Asesor
            </CardTitle>
            <CardDescription>
              Haz clic en un asesor para ver el detalle de sus pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible value={expandedAsesor} onValueChange={setExpandedAsesor}>
              {regionalCashbox.asesores.map((asesor) => (
                <AccordionItem key={asesor.asesor_id} value={asesor.asesor_id} className="border-b">
                  <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                          <User className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium">{asesor.asesor_nombre}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            <span>{getLocalidadName(asesor.region)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="font-heading text-lg font-bold text-green-600">
                            {formatCurrency(asesor.total_cobrado)}
                          </p>
                          <p className="text-xs text-gray-500">{asesor.numero_pagos} pagos</p>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {asesor.pagos?.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Cliente</TableHead>
                            <TableHead>Monto</TableHead>
                            <TableHead>Método</TableHead>
                            <TableHead>Hora</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asesor.pagos.map((pago, pIndex) => (
                            <TableRow key={pIndex}>
                              <TableCell className="font-medium">{pago.cliente_nombre}</TableCell>
                              <TableCell className="text-green-600 font-medium">
                                {formatCurrency(pago.monto)}
                              </TableCell>
                              <TableCell className="capitalize">{pago.metodo_pago}</TableCell>
                              <TableCell>
                                {new Date(pago.fecha_pago).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Sin pagos registrados hoy
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      )}

      {/* Today's Payments (Personal view for Asesor) */}
      {!isRegionalView && todayCashbox?.pagos?.length > 0 && (
        <Card className={todayCashbox?.estatus === "cerrado" ? "border-green-200 bg-green-50" : ""}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Mis Pagos del Día</CardTitle>
              {todayCashbox?.estatus === "cerrado" ? (
                <Badge className="bg-green-100 text-green-800">
                  <Lock className="w-3 h-3 mr-1" />
                  Caja Cerrada
                </Badge>
              ) : (
                <Badge className="bg-blue-100 text-blue-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Abierta
                </Badge>
              )}
            </div>
            <CardDescription>
              Total: {formatCurrency(todayCashbox?.total_cobrado)} | {todayCashbox?.numero_pagos || 0} pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Hora</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayCashbox.pagos.map((pago, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{pago.cliente_nombre}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(pago.monto)}
                    </TableCell>
                    <TableCell className="capitalize">{pago.metodo_pago}</TableCell>
                    <TableCell>
                      {new Date(pago.fecha_pago).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase">Historial de Cierres</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No hay cierres de caja anteriores</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Total Cobrado</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((cashbox, index) => (
                  <TableRow key={index} data-testid={`history-row-${index}`}>
                    <TableCell className="font-medium">{cashbox.fecha}</TableCell>
                    <TableCell>
                      {cashbox.tipo === "regional" || !cashbox.asesor_id ? (
                        <Badge className="bg-purple-100 text-purple-800">Regional</Badge>
                      ) : (
                        <Badge variant="outline">Personal</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(cashbox.total_cobrado)}
                    </TableCell>
                    <TableCell>{cashbox.numero_pagos}</TableCell>
                    <TableCell>
                      {cashbox.estatus === "cerrado" ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Cerrada
                        </Badge>
                      ) : (
                        <Badge variant="outline">Abierta</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Close Personal Cashbox Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Cerrar Mi Caja del Día
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                ¿Está seguro de cerrar su caja? Una vez cerrada no podrá registrar más pagos el día de hoy.
              </p>
              <div className="p-4 bg-gray-50 rounded-lg mb-4">
                <p className="text-lg font-bold text-green-600">
                  Total a cerrar: {formatCurrency(todayCashbox?.total_cobrado)}
                </p>
                <p className="text-sm text-gray-500">
                  {todayCashbox?.numero_pagos || 0} pagos registrados
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas (opcional)</label>
                <Textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Observaciones del cierre de caja..."
                  rows={2}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={handleCloseCashbox}
            >
              <Lock className="w-4 h-4 mr-2" />
              Confirmar Cierre
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Regional Cashbox Dialog */}
      <AlertDialog open={showCloseRegionalDialog} onOpenChange={setShowCloseRegionalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl flex items-center gap-2">
              <Lock className="w-5 h-5 text-green-600" />
              Cerrar Caja Regional
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Todos los asesores han cerrado su caja. ¿Desea proceder con el cierre regional?
              </p>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Regional</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(asesoresStatus?.resumen?.total_cobrado_regional)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Asesores / Pagos</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {asesoresStatus?.resumen?.total_asesores} / {asesoresStatus?.resumen?.total_pagos_regional}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notas del cierre regional (opcional)</label>
                <Textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Observaciones del cierre regional..."
                  rows={2}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCloseRegionalCashbox}
            >
              <Lock className="w-4 h-4 mr-2" />
              Cerrar Caja Regional
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
