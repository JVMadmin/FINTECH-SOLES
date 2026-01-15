import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Play,
  Ban,
  Check,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreditDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [credit, setCredit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthorizeDialog, setShowAuthorizeDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [evidenciaDesembolso, setEvidenciaDesembolso] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCredit();
  }, [id]);

  const fetchCredit = async () => {
    try {
      const response = await axios.get(`${API}/credits/${id}`);
      setCredit(response.data);
    } catch (error) {
      toast.error("Error al cargar crédito");
      navigate("/credits");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthorize = async () => {
    try {
      await axios.post(`${API}/credits/${id}/authorize`);
      toast.success("Crédito autorizado exitosamente");
      setShowAuthorizeDialog(false);
      fetchCredit();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al autorizar");
    }
  };

  const handleReject = async () => {
    try {
      await axios.post(`${API}/credits/${id}/reject`);
      toast.success("Crédito rechazado");
      setShowRejectDialog(false);
      fetchCredit();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al rechazar");
    }
  };

  const handleActivate = async () => {
    if (!evidenciaDesembolso) {
      toast.error("Debe subir una foto de evidencia del desembolso");
      return;
    }
    
    try {
      await axios.post(`${API}/credits/${id}/activate`, {
        evidencia_desembolso: evidenciaDesembolso
      });
      toast.success("Crédito activado - Desembolso confirmado");
      setShowActivateDialog(false);
      setEvidenciaDesembolso("");
      fetchCredit();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al activar");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(`${API}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setEvidenciaDesembolso(response.data.url);
      toast.success("Foto subida correctamente");
    } catch (error) {
      toast.error("Error al subir foto");
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusBadge = (estatus) => {
    const statusMap = {
      pendiente: { class: "bg-gray-100 text-gray-800 border-gray-300", icon: Clock },
      autorizado: { class: "bg-blue-100 text-blue-800 border-blue-300", icon: CheckCircle },
      vigente: { class: "bg-green-100 text-green-800 border-green-300", icon: CheckCircle },
      atrasado: { class: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: AlertTriangle },
      vencido: { class: "bg-red-100 text-red-800 border-red-300", icon: AlertTriangle },
      liquidado: { class: "bg-purple-100 text-purple-800 border-purple-300", icon: CheckCircle },
      rechazado: { class: "bg-red-100 text-red-800 border-red-300", icon: X },
    };
    const config = statusMap[estatus] || statusMap.pendiente;
    const Icon = config.icon;

    return (
      <Badge className={`${config.class} flex items-center gap-1 text-base px-3 py-1`}>
        <Icon className="w-4 h-4" />
        {estatus.charAt(0).toUpperCase() + estatus.slice(1)}
      </Badge>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const getPaymentStatusClass = (pago) => {
    if (pago.pagado) return "bg-green-50 border-green-200";
    
    const today = new Date().toISOString().split("T")[0];
    if (pago.fecha < today) return "bg-red-50 border-red-200";
    if (pago.fecha === today) return "bg-yellow-50 border-yellow-200";
    return "bg-gray-50 border-gray-200";
  };

  const progressPercentage = credit
    ? (credit.pagos_realizados / credit.plazo) * 100
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!credit) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="credit-detail-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/credits")} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        
        <div className="flex gap-2">
          {/* Gerente y Supervisor Actions */}
          {hasRole(["desarrollador", "gerente_regional", "supervisor"]) && credit.estatus === "pendiente" && (
            <>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowRejectDialog(true)}
                data-testid="reject-credit-btn"
              >
                <Ban className="w-4 h-4 mr-2" />
                Rechazar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => setShowAuthorizeDialog(true)}
                data-testid="authorize-credit-btn"
              >
                <Check className="w-4 h-4 mr-2" />
                Autorizar
              </Button>
            </>
          )}
          
          {hasRole(["desarrollador", "gerente_regional", "supervisor"]) && credit.estatus === "autorizado" && (
            <Button
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={() => setShowActivateDialog(true)}
              data-testid="activate-credit-btn"
            >
              <Play className="w-4 h-4 mr-2" />
              Confirmar Desembolso
            </Button>
          )}
        </div>
      </div>

      {/* Credit Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="font-heading text-2xl uppercase flex items-center gap-3">
                  Crédito {credit.tipo_credito}
                </CardTitle>
                <CardDescription>
                  Creado el {new Date(credit.created_at).toLocaleDateString()}
                </CardDescription>
              </div>
              {getStatusBadge(credit.estatus)}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Monto Otorgado</p>
                <p className="font-heading text-2xl font-bold text-green-600">
                  {formatCurrency(credit.monto_otorgado)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Saldo Pendiente</p>
                <p className="font-heading text-2xl font-bold text-gray-900">
                  {formatCurrency(credit.saldo_pendiente)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Pago por Cuota</p>
                <p className="font-heading text-2xl font-bold text-gray-900">
                  {formatCurrency(credit.monto_por_pago)}
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500 uppercase">Pagos</p>
                <p className="font-heading text-2xl font-bold text-gray-900">
                  {credit.pagos_realizados} / {credit.plazo}
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500">Progreso del Crédito</span>
                <span className="font-medium">{progressPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Inicio</p>
                  <p className="font-medium">{credit.fecha_inicio}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fecha Vencimiento</p>
                  <p className="font-medium">{credit.fecha_vencimiento}</p>
                </div>
              </div>
            </div>

            {/* Authorization Info */}
            {credit.autorizado_por && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>Autorizado:</strong> {credit.autorizado_fecha}
                </p>
              </div>
            )}
            
            {/* Evidencia de Desembolso */}
            {credit.evidencia_desembolso && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-800 text-sm mb-2">
                  <strong>Evidencia de Desembolso:</strong>
                </p>
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${credit.evidencia_desembolso}`}
                  alt="Evidencia de desembolso"
                  className="w-full max-w-md rounded-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Client Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/clients/${credit.cliente_id}`}>
              <div className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <p className="font-medium text-lg">{credit.cliente_nombre}</p>
                <p className="text-sm text-gray-500 capitalize mt-1">
                  Región: {credit.region}
                </p>
              </div>
            </Link>

            {credit.estatus === "vigente" || credit.estatus === "atrasado" ? (
              <Link to={`/cobranza?credito_id=${credit.id}`}>
                <Button className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700" data-testid="register-payment-btn">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Registrar Pago
                </Button>
              </Link>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Payment Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Calendario de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">#</TableHead>
                  <TableHead>Fecha Programada</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estatus</TableHead>
                  <TableHead>Fecha de Pago</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {credit.calendario_pagos?.map((pago, index) => (
                  <TableRow key={index} className={getPaymentStatusClass(pago)}>
                    <TableCell className="font-medium">{pago.numero_pago}</TableCell>
                    <TableCell>{pago.fecha}</TableCell>
                    <TableCell>{formatCurrency(pago.monto)}</TableCell>
                    <TableCell>
                      {pago.pagado ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Pagado
                        </Badge>
                      ) : pago.fecha < new Date().toISOString().split("T")[0] ? (
                        <Badge className="bg-red-100 text-red-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Atrasado
                        </Badge>
                      ) : pago.fecha === new Date().toISOString().split("T")[0] ? (
                        <Badge className="bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3 mr-1" />
                          Hoy
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>{pago.fecha_pago_real || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Authorize Dialog */}
      <AlertDialog open={showAuthorizeDialog} onOpenChange={setShowAuthorizeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Autorizar Crédito
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de autorizar este crédito por{" "}
              <strong>{formatCurrency(credit.monto_otorgado)}</strong> para{" "}
              <strong>{credit.cliente_nombre}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={handleAuthorize}
            >
              Sí, Autorizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Rechazar Crédito
            </AlertDialogTitle>
            <AlertDialogDescription>
              ¿Está seguro de rechazar este crédito? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleReject}
            >
              Sí, Rechazar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Dialog */}
      <AlertDialog open={showActivateDialog} onOpenChange={setShowActivateDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-xl">
              Confirmar Desembolso
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <p>
                  Al confirmar el desembolso, el crédito se activará y comenzará el calendario de pagos.
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p><strong>Monto a desembolsar:</strong> {formatCurrency(credit.monto_otorgado)}</p>
                  <p><strong>Cliente:</strong> {credit.cliente_nombre}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Evidencia Fotográfica del Desembolso *
                  </Label>
                  {evidenciaDesembolso ? (
                    <div className="relative">
                      <img
                        src={`${process.env.REACT_APP_BACKEND_URL}${evidenciaDesembolso}`}
                        alt="Evidencia"
                        className="w-full h-48 object-cover rounded-lg"
                      />
                      <Button
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => setEvidenciaDesembolso("")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-32 flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600" />
                      ) : (
                        <>
                          <Camera className="w-8 h-8 text-gray-400" />
                          <span className="text-gray-500">Tomar foto del desembolso</span>
                        </>
                      )}
                    </Button>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                  />
                  <p className="text-xs text-gray-500">
                    Tome una foto del momento de entrega del dinero al cliente
                  </p>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setEvidenciaDesembolso("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700"
              onClick={handleActivate}
              disabled={!evidenciaDesembolso}
            >
              Confirmar Desembolso
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
