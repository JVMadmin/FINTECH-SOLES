import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  CreditCard,
  Plus,
  Search,
  Eye,
  Filter,
  X,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CREDIT_TYPES = [
  { value: "diario", label: "Diario (Lunes a Viernes)" },
  { value: "semanal", label: "Semanal" },
  { value: "catorcenal", label: "Catorcenal" },
];

export default function CreditsPage() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [credits, setCredits] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstatus, setFilterEstatus] = useState(searchParams.get("estatus") || "");
  const [filterTipo, setFilterTipo] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(searchParams.get("new") === "true");
  const [selectedClientId, setSelectedClientId] = useState(searchParams.get("cliente_id") || "");
  const [newCredit, setNewCredit] = useState({
    cliente_id: searchParams.get("cliente_id") || "",
    monto_otorgado: "",
    tipo_credito: "diario",
    plazo: "",
    monto_por_pago: "",
    modalidad_inicio: "dia_siguiente",
  });

  useEffect(() => {
    fetchCredits();
    fetchClients();
  }, [filterEstatus, filterTipo]);

  const fetchCredits = async () => {
    try {
      let url = `${API}/credits`;
      const params = new URLSearchParams();
      if (filterEstatus) params.append("estatus", filterEstatus);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await axios.get(url);
      setCredits(response.data);
    } catch (error) {
      toast.error("Error al cargar créditos");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await axios.get(`${API}/clients`);
      setClients(response.data);
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const handleCreateCredit = async () => {
    if (!newCredit.cliente_id || !newCredit.monto_otorgado || !newCredit.plazo || !newCredit.monto_por_pago) {
      toast.error("Por favor complete todos los campos");
      return;
    }

    try {
      const response = await axios.post(`${API}/credits`, {
        ...newCredit,
        monto_otorgado: parseFloat(newCredit.monto_otorgado),
        plazo: parseInt(newCredit.plazo),
        monto_por_pago: parseFloat(newCredit.monto_por_pago),
      });
      toast.success("Crédito creado exitosamente. Pendiente de autorización.");
      setIsDialogOpen(false);
      setNewCredit({
        cliente_id: "",
        monto_otorgado: "",
        tipo_credito: "diario",
        plazo: "",
        monto_por_pago: "",
        modalidad_inicio: "dia_siguiente",
      });
      fetchCredits();
      navigate(`/credits/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear crédito");
    }
  };

  const calculatePayment = () => {
    if (newCredit.monto_otorgado && newCredit.plazo) {
      const monto = parseFloat(newCredit.monto_otorgado);
      const plazo = parseInt(newCredit.plazo);
      if (monto > 0 && plazo > 0) {
        const pago = (monto / plazo).toFixed(2);
        setNewCredit({ ...newCredit, monto_por_pago: pago });
      }
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
      <Badge className={`${config.class} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
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

  const filteredCredits = credits.filter((credit) => {
    const matchesSearch = credit.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = !filterTipo || credit.tipo_credito === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const clearFilters = () => {
    setFilterEstatus("");
    setFilterTipo("");
    setSearchTerm("");
  };

  return (
    <div className="space-y-6 animate-fade-in" data-testid="credits-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Créditos
          </h1>
          <p className="text-gray-500 mt-1">{filteredCredits.length} créditos encontrados</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-credit-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Crédito
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl uppercase">Nuevo Crédito</DialogTitle>
              <DialogDescription>
                Complete los datos del crédito. Será enviado para autorización.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Select
                  value={newCredit.cliente_id}
                  onValueChange={(value) => setNewCredit({ ...newCredit, cliente_id: value })}
                >
                  <SelectTrigger data-testid="credit-client-select">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.nombre_completo} - {client.region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto a Otorgar *</Label>
                  <Input
                    type="number"
                    value={newCredit.monto_otorgado}
                    onChange={(e) => setNewCredit({ ...newCredit, monto_otorgado: e.target.value })}
                    onBlur={calculatePayment}
                    placeholder="0.00"
                    data-testid="credit-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Crédito *</Label>
                  <Select
                    value={newCredit.tipo_credito}
                    onValueChange={(value) => setNewCredit({ ...newCredit, tipo_credito: value })}
                  >
                    <SelectTrigger data-testid="credit-type-select">
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Número de Pagos *</Label>
                  <Input
                    type="number"
                    value={newCredit.plazo}
                    onChange={(e) => setNewCredit({ ...newCredit, plazo: e.target.value })}
                    onBlur={calculatePayment}
                    placeholder="Ej: 20"
                    data-testid="credit-term-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Monto por Pago *</Label>
                  <Input
                    type="number"
                    value={newCredit.monto_por_pago}
                    onChange={(e) => setNewCredit({ ...newCredit, monto_por_pago: e.target.value })}
                    placeholder="0.00"
                    data-testid="credit-payment-input"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Modalidad de Inicio</Label>
                <Select
                  value={newCredit.modalidad_inicio}
                  onValueChange={(value) => setNewCredit({ ...newCredit, modalidad_inicio: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia_siguiente">Día siguiente a autorización</SelectItem>
                    <SelectItem value="proxima_fecha_pago">Próxima fecha de pago válida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newCredit.monto_otorgado && newCredit.plazo && newCredit.monto_por_pago && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-500">Resumen del Crédito</p>
                    <div className="grid grid-cols-3 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-gray-400">Monto Total</p>
                        <p className="font-bold text-green-600">
                          {formatCurrency(newCredit.monto_otorgado)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Pagos</p>
                        <p className="font-bold">{newCredit.plazo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Por Pago</p>
                        <p className="font-bold">{formatCurrency(newCredit.monto_por_pago)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={handleCreateCredit}
                data-testid="save-credit-btn"
              >
                Crear Crédito
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-credits"
              />
            </div>

            <Select value={filterEstatus} onValueChange={setFilterEstatus}>
              <SelectTrigger className="w-full md:w-48" data-testid="filter-status">
                <SelectValue placeholder="Todos los estatus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="vigente">Vigente</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
                <SelectItem value="liquidado">Liquidado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full md:w-40" data-testid="filter-type">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                {CREDIT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label.split(" ")[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterEstatus || filterTipo || searchTerm) && (
              <Button variant="ghost" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Credits List - Mobile Cards */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredCredits.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-gray-500">No se encontraron créditos</p>
            </CardContent>
          </Card>
        ) : (
          filteredCredits.map((credit) => (
            <Link key={credit.id} to={`/credits/${credit.id}`}>
              <Card className="card-interactive" data-testid={`credit-card-${credit.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">{credit.cliente_nombre}</h3>
                      <p className="text-sm text-gray-500 capitalize">{credit.tipo_credito}</p>
                    </div>
                    {getStatusBadge(credit.estatus)}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <p className="text-xs text-gray-400">Otorgado</p>
                      <p className="font-medium text-green-600">{formatCurrency(credit.monto_otorgado)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Saldo</p>
                      <p className="font-medium">{formatCurrency(credit.saldo_pendiente)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Pagos</p>
                      <p className="font-medium">{credit.pagos_realizados}/{credit.plazo}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Credits List - Desktop Table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Saldo</TableHead>
                <TableHead>Pagos</TableHead>
                <TableHead>Fecha Inicio</TableHead>
                <TableHead>Estatus</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="animate-pulse">Cargando...</div>
                  </TableCell>
                </TableRow>
              ) : filteredCredits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron créditos
                  </TableCell>
                </TableRow>
              ) : (
                filteredCredits.map((credit) => (
                  <TableRow
                    key={credit.id}
                    className="table-row-hover cursor-pointer"
                    onClick={() => navigate(`/credits/${credit.id}`)}
                    data-testid={`credit-row-${credit.id}`}
                  >
                    <TableCell className="font-medium">{credit.cliente_nombre}</TableCell>
                    <TableCell className="capitalize">{credit.tipo_credito}</TableCell>
                    <TableCell className="text-green-600 font-medium">
                      {formatCurrency(credit.monto_otorgado)}
                    </TableCell>
                    <TableCell>{formatCurrency(credit.saldo_pendiente)}</TableCell>
                    <TableCell>{credit.pagos_realizados}/{credit.plazo}</TableCell>
                    <TableCell>{credit.fecha_inicio}</TableCell>
                    <TableCell>{getStatusBadge(credit.estatus)}</TableCell>
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
