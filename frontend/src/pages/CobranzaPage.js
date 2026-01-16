import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet,
  DollarSign,
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle,
  User,
  XCircle,
  Camera,
  MapPin,
  Phone,
  Navigation,
  CalendarDays,
  CalendarRange,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const NO_PAYMENT_REASONS = [
  { value: "no_pago", label: "Cliente no pagó", icon: XCircle, color: "text-red-500" },
  { value: "no_localizado", label: "No se localizó", icon: MapPin, color: "text-orange-500" },
  { value: "promesa_pago", label: "Promesa de pago", icon: Calendar, color: "text-blue-500" },
  { value: "otro", label: "Otro motivo", icon: AlertTriangle, color: "text-gray-500" },
];

export default function CobranzaPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  
  // Payment states
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("efectivo");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // No Payment states
  const [showNoPaymentDialog, setShowNoPaymentDialog] = useState(false);
  const [noPaymentReason, setNoPaymentReason] = useState("");
  const [noPaymentDescription, setNoPaymentDescription] = useState("");
  const [noPaymentEvidence, setNoPaymentEvidence] = useState("");
  const [promiseDate, setPromiseDate] = useState("");
  const [showNoPaymentConfirm, setShowNoPaymentConfirm] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchAlerts();
    
    const creditoId = searchParams.get("credito_id");
    if (creditoId) {
      loadCreditForPayment(creditoId);
    }
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      toast.error("Error al cargar alertas de cobranza");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCreditForPayment = async (creditoId) => {
    try {
      const response = await axios.get(`${API}/credits/${creditoId}`);
      const credit = response.data;
      
      const nextPayment = credit.calendario_pagos?.find(p => !p.pagado);
      
      if (nextPayment) {
        setSelectedAlert({
          credito_id: credit.id,
          cliente_id: credit.cliente_id,
          cliente_nombre: credit.cliente_nombre,
          monto_pendiente: nextPayment.monto,
          fecha_pago: nextPayment.fecha,
          tipo: "pago_manual",
        });
        setPaymentAmount(nextPayment.monto.toString());
        setShowPaymentDialog(true);
      }
    } catch (error) {
      console.error("Error loading credit:", error);
    }
  };

  const handleSelectAlert = (alert, action = "payment") => {
    setSelectedAlert(alert);
    setPaymentAmount(alert.monto_pendiente.toString());
    setPaymentNotes("");
    setNoPaymentReason("");
    setNoPaymentDescription("");
    setNoPaymentEvidence("");
    setPromiseDate("");
    
    if (action === "payment") {
      setShowPaymentDialog(true);
    } else {
      setShowNoPaymentDialog(true);
    }
  };

  const handleConfirmPayment = () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error("Ingrese un monto válido");
      return;
    }
    setShowPaymentDialog(false);
    setShowConfirmDialog(true);
  };

  const handleRegisterPayment = async () => {
    try {
      await axios.post(`${API}/payments`, {
        credito_id: selectedAlert.credito_id,
        monto: parseFloat(paymentAmount),
        metodo_pago: paymentMethod,
        notas: paymentNotes,
      });
      
      toast.success("Pago registrado exitosamente");
      setShowConfirmDialog(false);
      setSelectedAlert(null);
      setPaymentAmount("");
      setPaymentNotes("");
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrar pago");
    }
  };

  const handleConfirmNoPayment = () => {
    if (!noPaymentReason) {
      toast.error("Seleccione un motivo");
      return;
    }
    if (noPaymentReason === "promesa_pago" && !promiseDate) {
      toast.error("Ingrese la fecha de promesa de pago");
      return;
    }
    setShowNoPaymentDialog(false);
    setShowNoPaymentConfirm(true);
  };

  const handleRegisterNoPayment = async () => {
    try {
      await axios.post(`${API}/no-payments`, {
        credito_id: selectedAlert.credito_id,
        motivo: noPaymentReason,
        descripcion: noPaymentDescription,
        evidencia_url: noPaymentEvidence,
        fecha_promesa: noPaymentReason === "promesa_pago" ? promiseDate : null,
      });
      
      toast.success("Incidencia registrada correctamente");
      setShowNoPaymentConfirm(false);
      setSelectedAlert(null);
      setNoPaymentReason("");
      setNoPaymentDescription("");
      setNoPaymentEvidence("");
      setPromiseDate("");
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al registrar incidencia");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setNoPaymentEvidence(response.data.url);
      toast.success("Evidencia subida correctamente");
    } catch (error) {
      toast.error("Error al subir evidencia");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case "pago_hoy":
        return <Clock className="w-6 h-6 text-blue-500" />;
      case "atrasado":
        return <AlertTriangle className="w-6 h-6 text-red-500" />;
      case "por_vencer":
        return <Calendar className="w-6 h-6 text-yellow-500" />;
      default:
        return <Wallet className="w-6 h-6 text-gray-500" />;
    }
  };

  const getAlertCardClass = (tipo) => {
    switch (tipo) {
      case "pago_hoy":
        return "border-l-4 border-l-blue-500 bg-blue-50";
      case "atrasado":
        return "border-l-4 border-l-red-500 bg-red-50";
      case "por_vencer":
        return "border-l-4 border-l-yellow-500 bg-yellow-50";
      default:
        return "";
    }
  };

  const getAlertBadge = (tipo, diasAtraso) => {
    switch (tipo) {
      case "pago_hoy":
        return <Badge className="bg-blue-100 text-blue-800">Cobrar Hoy</Badge>;
      case "atrasado":
        return <Badge className="bg-red-100 text-red-800">{diasAtraso} días de atraso</Badge>;
      case "por_vencer":
        return <Badge className="bg-yellow-100 text-yellow-800">Próximo</Badge>;
      default:
        return null;
    }
  };

  const alertsHoy = alerts.filter(a => a.tipo === "pago_hoy");
  const alertsAtrasados = alerts.filter(a => a.tipo === "atrasado");
  const alertsPorVencer = alerts.filter(a => a.tipo === "por_vencer");
  
  // Separar por vencer por tipo de crédito
  const alertsSemanales = alertsPorVencer.filter(a => a.tipo_credito === "semanal");
  const alertsCatorcenales = alertsPorVencer.filter(a => a.tipo_credito === "catorcenal");
  const alertsDiarios = alertsPorVencer.filter(a => a.tipo_credito === "diario");

  // Función para abrir mapa con coordenadas
  const openMap = (alert, e) => {
    e.stopPropagation();
    if (alert.coordenadas_domicilio?.lat && alert.coordenadas_domicilio?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${alert.coordenadas_domicilio.lat},${alert.coordenadas_domicilio.lng}`;
      window.open(url, "_blank");
    } else if (alert.cliente_direccion) {
      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(alert.cliente_direccion)}`;
      window.open(url, "_blank");
    } else {
      toast.error("No hay coordenadas o dirección disponible");
    }
  };

  const getTipoCreditoBadge = (tipo) => {
    const tipos = {
      diario: { label: "Diario", color: "bg-blue-100 text-blue-800" },
      semanal: { label: "Semanal", color: "bg-purple-100 text-purple-800" },
      catorcenal: { label: "Catorcenal", color: "bg-indigo-100 text-indigo-800" },
    };
    const t = tipos[tipo] || tipos.diario;
    return <Badge className={`${t.color} text-xs`}>{t.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="cobranza-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
          Cobranza
        </h1>
        <p className="text-gray-500 mt-1">
          Gestión de pagos y alertas de cobranza
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-blue-500" data-testid="summary-hoy">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pagos de Hoy</p>
                <p className="font-heading text-2xl font-bold">{alertsHoy.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500" data-testid="summary-atrasados">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pagos Atrasados</p>
                <p className="font-heading text-2xl font-bold text-red-600">{alertsAtrasados.length}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500" data-testid="summary-proximos">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Próximos a Vencer</p>
                <p className="font-heading text-2xl font-bold">{alertsPorVencer.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="font-heading text-xl font-bold mb-2">¡Todo al día!</h3>
            <p className="text-gray-500">No hay pagos pendientes por cobrar</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Atrasados First */}
          {alertsAtrasados.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                PAGOS ATRASADOS
              </h2>
              <div className="space-y-3">
                {alertsAtrasados.map((alert, index) => (
                  <Card
                    key={`${alert.credito_id}-${index}`}
                    className={`${getAlertCardClass(alert.tipo)}`}
                    data-testid={`alert-atrasado-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getAlertIcon(alert.tipo)}
                          <div>
                            <h3 className="font-medium text-gray-900">{alert.cliente_nombre}</h3>
                            <p className="text-sm text-gray-500">
                              Vencido: {alert.fecha_pago}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            {getAlertBadge(alert.tipo, alert.dias_atraso)}
                            <p className="font-heading text-xl font-bold mt-1">
                              {formatCurrency(alert.monto_pendiente)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSelectAlert(alert, "payment")}
                              data-testid={`pay-btn-${index}`}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Cobrar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleSelectAlert(alert, "no_payment")}
                              data-testid={`no-pay-btn-${index}`}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              No Pagó
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Pagos de Hoy */}
          {alertsHoy.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-bold text-blue-600 mb-3 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                PAGOS DE HOY
              </h2>
              <div className="space-y-3">
                {alertsHoy.map((alert, index) => (
                  <Card
                    key={`${alert.credito_id}-${index}`}
                    className={`${getAlertCardClass(alert.tipo)}`}
                    data-testid={`alert-hoy-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getAlertIcon(alert.tipo)}
                          <div>
                            <h3 className="font-medium text-gray-900">{alert.cliente_nombre}</h3>
                            <p className="text-sm text-gray-500">
                              Fecha: {alert.fecha_pago}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            {getAlertBadge(alert.tipo)}
                            <p className="font-heading text-xl font-bold mt-1">
                              {formatCurrency(alert.monto_pendiente)}
                            </p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleSelectAlert(alert, "payment")}
                            >
                              <DollarSign className="w-4 h-4 mr-1" />
                              Cobrar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50"
                              onClick={() => handleSelectAlert(alert, "no_payment")}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              No Pagó
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Próximos a Vencer */}
          {alertsPorVencer.length > 0 && (
            <div>
              <h2 className="font-heading text-lg font-bold text-yellow-600 mb-3 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                PRÓXIMOS A VENCER
              </h2>
              <div className="space-y-3">
                {alertsPorVencer.map((alert, index) => (
                  <Card
                    key={`${alert.credito_id}-${index}`}
                    className={`${getAlertCardClass(alert.tipo)}`}
                    data-testid={`alert-proximo-${index}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {getAlertIcon(alert.tipo)}
                          <div>
                            <h3 className="font-medium text-gray-900">{alert.cliente_nombre}</h3>
                            <p className="text-sm text-gray-500">
                              Fecha: {alert.fecha_pago}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4">
                            {getAlertBadge(alert.tipo)}
                            <p className="font-heading text-xl font-bold mt-1">
                              {formatCurrency(alert.monto_pendiente)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectAlert(alert, "payment")}
                          >
                            <DollarSign className="w-4 h-4 mr-1" />
                            Adelantar Pago
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <Wallet className="w-5 h-5 text-yellow-600" />
              Registrar Pago
            </DialogTitle>
            <DialogDescription>
              Complete los datos del pago recibido
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedAlert.cliente_nombre}</p>
                    <p className="text-sm text-gray-500">
                      Fecha de pago: {selectedAlert.fecha_pago}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Monto del Pago *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="pl-10 h-14 text-2xl font-bold"
                    placeholder="0.00"
                    data-testid="payment-amount-input"
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Monto sugerido: {formatCurrency(selectedAlert.monto_pendiente)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Método de Pago</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="deposito">Depósito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Observaciones del pago..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={handleConfirmPayment}
              data-testid="continue-payment-btn"
            >
              Continuar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Payment Dialog */}
      <Dialog open={showNoPaymentDialog} onOpenChange={setShowNoPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl uppercase flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              Registrar Incidencia
            </DialogTitle>
            <DialogDescription>
              Registre el motivo por el cual no se realizó el cobro
            </DialogDescription>
          </DialogHeader>

          {selectedAlert && (
            <div className="space-y-4 py-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="w-8 h-8 text-gray-400" />
                  <div>
                    <p className="font-medium">{selectedAlert.cliente_nombre}</p>
                    <p className="text-sm text-gray-500">
                      Monto pendiente: {formatCurrency(selectedAlert.monto_pendiente)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Motivo *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {NO_PAYMENT_REASONS.map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <Button
                        key={reason.value}
                        type="button"
                        variant={noPaymentReason === reason.value ? "default" : "outline"}
                        className={`h-auto py-3 flex-col gap-1 ${
                          noPaymentReason === reason.value ? "bg-yellow-600" : ""
                        }`}
                        onClick={() => setNoPaymentReason(reason.value)}
                      >
                        <Icon className={`w-5 h-5 ${noPaymentReason === reason.value ? "text-white" : reason.color}`} />
                        <span className="text-xs">{reason.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              {noPaymentReason === "promesa_pago" && (
                <div className="space-y-2">
                  <Label>Fecha de Promesa de Pago *</Label>
                  <Input
                    type="date"
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Textarea
                  value={noPaymentDescription}
                  onChange={(e) => setNoPaymentDescription(e.target.value)}
                  placeholder="Detalles adicionales..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Evidencia de Contacto (opcional)</Label>
                {noPaymentEvidence ? (
                  <div className="relative">
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${noPaymentEvidence}`}
                      alt="Evidencia"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={() => setNoPaymentEvidence("")}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-24 flex-col gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">Subir foto de evidencia</span>
                  </Button>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNoPaymentDialog(false)}>
              Cancelar
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              onClick={handleConfirmNoPayment}
              data-testid="continue-no-payment-btn"
            >
              Registrar Incidencia
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Confirmar Pago
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Por favor confirme los datos del pago:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p><strong>Cliente:</strong> {selectedAlert?.cliente_nombre}</p>
                <p><strong>Monto:</strong> {formatCurrency(paymentAmount)}</p>
                <p><strong>Método:</strong> {paymentMethod}</p>
                {paymentNotes && <p><strong>Notas:</strong> {paymentNotes}</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleRegisterPayment}
              data-testid="confirm-payment-btn"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar Pago
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* No Payment Confirmation Dialog */}
      <AlertDialog open={showNoPaymentConfirm} onOpenChange={setShowNoPaymentConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Confirmar Incidencia
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Por favor confirme los datos de la incidencia:</p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2">
                <p><strong>Cliente:</strong> {selectedAlert?.cliente_nombre}</p>
                <p><strong>Motivo:</strong> {NO_PAYMENT_REASONS.find(r => r.value === noPaymentReason)?.label}</p>
                {promiseDate && <p><strong>Fecha de promesa:</strong> {promiseDate}</p>}
                {noPaymentDescription && <p><strong>Descripción:</strong> {noPaymentDescription}</p>}
                {noPaymentEvidence && <p><strong>Evidencia:</strong> Foto adjunta</p>}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleRegisterNoPayment}
              data-testid="confirm-no-payment-btn"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirmar Incidencia
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
