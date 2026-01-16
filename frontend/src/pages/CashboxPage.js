import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  ChevronDown,
  Users,
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
  const [history, setHistory] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
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
      
      // Agregar endpoint regional si tiene permisos
      if (isRegionalView) {
        let regionalUrl = `${API}/cashbox/regional`;
        const params = new URLSearchParams();
        if (filterAsesor) params.append("asesor_id", filterAsesor);
        if (filterLocalidad) params.append("localidad", filterLocalidad);
        if (params.toString()) regionalUrl += `?${params.toString()}`;
        promises.push(axios.get(regionalUrl));
        
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
        setAsesores(results[3].data.filter(u => u.rol === "asesor" && u.activo));
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

        {todayCashbox?.estatus !== "cerrado" && (
          <Button
            className="bg-yellow-600 hover:bg-yellow-700"
            onClick={() => setShowCloseDialog(true)}
            data-testid="close-cashbox-btn"
          >
            <Lock className="w-4 h-4 mr-2" />
            Cerrar Caja
          </Button>
        )}
      </div>

      {/* Filters for Regional View */}
      {isRegionalView && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Filter className="w-4 h-4" />
                <span>Filtrar por:</span>
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

      {/* Today's Summary */}
      <Card className={todayCashbox?.estatus === "cerrado" ? "border-green-200 bg-green-50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {isRegionalView ? "Resumen Regional del Día" : "Mi Caja del Día"}
            </CardTitle>
            {todayCashbox?.estatus === "cerrado" ? (
              <Badge className="bg-green-100 text-green-800">
                <Lock className="w-3 h-3 mr-1" />
                Cerrada
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-800">
                <Clock className="w-3 h-3 mr-1" />
                Abierta
              </Badge>
            )}
          </div>
          <CardDescription>
            {isRegionalView 
              ? `Caja regional - ${user?.region ? getLocalidadName(user.region) : "Todas las zonas"}`
              : "Tu caja del día"
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-gray-500 mb-1">Total Cobrado</p>
              <p className="font-heading text-3xl font-bold text-green-600">
                {formatCurrency(isRegionalView ? regionalCashbox?.total_regional : todayCashbox?.total_cobrado)}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-500 mb-1">Pagos Registrados</p>
              <p className="font-heading text-3xl font-bold text-gray-900">
                {isRegionalView ? regionalCashbox?.total_pagos : todayCashbox?.numero_pagos || 0}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <p className="text-sm text-gray-500 mb-1">
                {isRegionalView ? "Asesores Activos" : "Fecha"}
              </p>
              <p className="font-heading text-xl font-bold text-gray-900">
                {isRegionalView 
                  ? regionalCashbox?.asesores?.length || 0
                  : todayCashbox?.fecha || new Date().toISOString().split("T")[0]
                }
              </p>
            </div>
          </div>

          {todayCashbox?.estatus === "cerrado" && (
            <div className="mt-6 p-4 bg-green-100 rounded-lg border border-green-200">
              <p className="text-green-800 text-sm">
                <strong>Caja cerrada:</strong> {todayCashbox.cerrado_fecha}
                {todayCashbox.notas && (
                  <span className="block mt-1 text-green-700">Notas: {todayCashbox.notas}</span>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary by Localidad */}
      {isRegionalView && regionalCashbox?.por_localidad && Object.keys(regionalCashbox.por_localidad).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Resumen por Localidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(regionalCashbox.por_localidad).map(([localidad, data]) => (
                <div key={localidad} className="p-4 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-600 mb-1">{getLocalidadName(localidad)}</p>
                  <p className="font-heading text-xl font-bold text-green-600">
                    {formatCurrency(data.total)}
                  </p>
                  <p className="text-xs text-gray-500">{data.pagos} pagos</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cashbox by Asesor (Regional View) */}
      {isRegionalView && regionalCashbox?.asesores?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Cobros por Asesor
            </CardTitle>
            <CardDescription>
              Haz clic en un asesor para ver el detalle de sus pagos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Accordion type="single" collapsible value={expandedAsesor} onValueChange={setExpandedAsesor}>
              {regionalCashbox.asesores.map((asesor, index) => (
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Mis Pagos del Día</CardTitle>
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
                  <TableHead>Total Cobrado</TableHead>
                  <TableHead>Pagos</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((cashbox, index) => (
                  <TableRow key={index} data-testid={`history-row-${index}`}>
                    <TableCell className="font-medium">{cashbox.fecha}</TableCell>
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

      {/* Close Cashbox Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Cerrar Caja del Día
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                ¿Está seguro de cerrar la caja? Una vez cerrada no podrá registrar más pagos el día de hoy.
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
    </div>
  );
}
