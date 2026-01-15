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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Receipt,
  DollarSign,
  Calendar,
  Lock,
  CheckCircle,
  Clock,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CashboxPage() {
  const { user } = useAuth();
  const [todayCashbox, setTodayCashbox] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeNotes, setCloseNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        axios.get(`${API}/cashbox/today`),
        axios.get(`${API}/cashbox/history`),
      ]);
      setTodayCashbox(todayRes.data);
      setHistory(historyRes.data);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
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
            Caja del Día
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

      {/* Today's Summary */}
      <Card className={todayCashbox?.estatus === "cerrado" ? "border-green-200 bg-green-50" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              {user?.rol === "asesor" ? "Mi Caja del Día" : "Resumen de Caja Regional"}
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
            {user?.rol === "asesor" ? "Tu caja del día" : `Caja regional - ${user?.region || "General"}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-gray-500 mb-1">Total Cobrado</p>
              <p className="font-heading text-3xl font-bold text-green-600">
                {formatCurrency(todayCashbox?.total_cobrado)}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-sm text-gray-500 mb-1">Pagos Registrados</p>
              <p className="font-heading text-3xl font-bold text-gray-900">
                {todayCashbox?.numero_pagos || 0}
              </p>
            </div>
            <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-gray-500 mb-1">Fecha</p>
              <p className="font-heading text-xl font-bold text-gray-900">
                {todayCashbox?.fecha || new Date().toISOString().split("T")[0]}
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

      {/* Today's Payments */}
      {todayCashbox?.pagos?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pagos del Día</CardTitle>
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
