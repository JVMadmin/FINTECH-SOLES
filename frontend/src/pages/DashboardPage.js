import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  ArrowRight,
  DollarSign,
  Calendar,
  Bell,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [carteraRegional, setCarteraRegional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, alertsRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard`),
        axios.get(`${API}/alerts`),
      ]);
      setStats(statsRes.data);
      setAlerts(alertsRes.data);
      
      // Si es supervisor, cargar cartera regional
      if (user?.rol === "supervisor") {
        try {
          const carteraRes = await axios.get(`${API}/stats/cartera-regional`);
          setCarteraRegional(carteraRes.data);
        } catch (e) {
          console.error("Error loading regional data:", e);
        }
      }
    } catch (error) {
      toast.error("Error al cargar datos del dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const getRoleName = (rol) => {
    const names = {
      desarrollador: "Desarrollador",
      administrador: "Administrador",
      gerente_regional: "Gerente Regional",
      supervisor: "Supervisor",
      asesor: "Asesor de Crédito",
    };
    return names[rol] || rol;
  };

  const getAlertIcon = (tipo) => {
    switch (tipo) {
      case "pago_hoy":
        return <Clock className="w-5 h-5 text-blue-500" />;
      case "atrasado":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case "por_vencer":
        return <Calendar className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAlertBadge = (tipo) => {
    switch (tipo) {
      case "pago_hoy":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Hoy</Badge>;
      case "atrasado":
        return <Badge className="bg-red-100 text-red-800 border-red-300">Atrasado</Badge>;
      case "por_vencer":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Por vencer</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Bienvenido, <span className="font-medium text-gray-700">{user?.nombre_completo}</span>
            <span className="mx-2">•</span>
            <span className="text-yellow-600">{getRoleName(user?.rol)}</span>
            {user?.region && (
              <>
                <span className="mx-2">•</span>
                <span className="capitalize">{user.region}</span>
              </>
            )}
          </p>
          {stats?.tipo_cartera && (
            <Badge className={stats.tipo_cartera === "regional" ? "bg-purple-100 text-purple-800 mt-2" : "bg-blue-100 text-blue-800 mt-2"}>
              {stats.tipo_cartera === "regional" ? "📊 Cartera Regional" : "👤 Cartera Personal"}
              {stats.asesores_count > 0 && ` • ${stats.asesores_count} asesores`}
            </Badge>
          )}
        </div>
        <div className="flex gap-3">
          <Link to="/clients">
            <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-client-btn">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-hover" data-testid="stat-clientes">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Clientes</p>
                <p className="font-heading text-3xl font-bold text-gray-900 mt-1">
                  {stats?.total_clientes || 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-creditos">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Créditos Activos</p>
                <p className="font-heading text-3xl font-bold text-gray-900 mt-1">
                  {stats?.creditos_vigentes || 0}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-yellow-600">{stats?.creditos_atrasados || 0} atrasados</span>
                  <span className="text-xs text-red-600">{stats?.creditos_vencidos || 0} vencidos</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-cobro-hoy">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Cobrado Hoy</p>
                <p className="font-heading text-3xl font-bold text-green-600 mt-1">
                  {formatCurrency(stats?.cobro_hoy)}
                </p>
                <p className="text-xs text-gray-500 mt-2">{stats?.pagos_hoy || 0} pagos registrados</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover" data-testid="stat-saldo">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wider">Saldo Pendiente</p>
                <p className="font-heading text-3xl font-bold text-gray-900 mt-1">
                  {formatCurrency(stats?.saldo_pendiente)}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Total otorgado: {formatCurrency(stats?.monto_total_otorgado)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Credits - Only for Gerente */}
      {hasRole(["desarrollador", "gerente_regional"]) && stats?.creditos_pendientes > 0 && (
        <Card className="border-yellow-200 bg-yellow-50" data-testid="pending-credits-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Créditos Pendientes de Autorización
              </CardTitle>
              <Badge className="bg-yellow-600 text-white">{stats.creditos_pendientes}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Link to="/credits?estatus=pendiente">
              <Button variant="outline" className="border-yellow-300 hover:bg-yellow-100">
                Ver Créditos Pendientes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Cartera Regional para Supervisores */}
      {carteraRegional && carteraRegional.asesores?.length > 0 && (
        <Card data-testid="cartera-regional-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-purple-600" />
              Cartera Regional - Mis Asesores
            </CardTitle>
            <CardDescription>Resumen de cartera por asesor</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3">Asesor</th>
                    <th className="text-right py-2 px-3">Clientes</th>
                    <th className="text-right py-2 px-3">Créditos</th>
                    <th className="text-right py-2 px-3">Saldo Pendiente</th>
                    <th className="text-right py-2 px-3">Cobrado Hoy</th>
                  </tr>
                </thead>
                <tbody>
                  {carteraRegional.asesores.map((asesor) => (
                    <tr key={asesor.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{asesor.nombre}</td>
                      <td className="py-2 px-3 text-right">{asesor.clientes}</td>
                      <td className="py-2 px-3 text-right">{asesor.creditos_activos}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(asesor.saldo_pendiente)}</td>
                      <td className="py-2 px-3 text-right text-green-600 font-medium">{formatCurrency(asesor.cobro_hoy)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-100 font-bold">
                    <td className="py-2 px-3">TOTAL REGIONAL</td>
                    <td className="py-2 px-3 text-right">{carteraRegional.totales.clientes}</td>
                    <td className="py-2 px-3 text-right">{carteraRegional.totales.creditos_vigentes}</td>
                    <td className="py-2 px-3 text-right">{formatCurrency(carteraRegional.totales.saldo_pendiente)}</td>
                    <td className="py-2 px-3 text-right text-green-600">{formatCurrency(carteraRegional.totales.cobro_hoy)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Alerts */}
        <Card data-testid="alerts-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-600" />
                Alertas de Cobranza
              </CardTitle>
              <Link to="/cobranza">
                <Button variant="ghost" size="sm">
                  Ver todo <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
            <CardDescription>Pagos pendientes y próximos a vencer</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <p>No hay alertas pendientes</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {alerts.slice(0, 5).map((alert, index) => (
                  <Link
                    key={`${alert.credito_id}-${index}`}
                    to={`/credits/${alert.credito_id}`}
                    className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    data-testid={`alert-item-${index}`}
                  >
                    <div className="flex items-center gap-3">
                      {getAlertIcon(alert.tipo)}
                      <div>
                        <p className="font-medium text-gray-900">{alert.cliente_nombre}</p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(alert.monto_pendiente)}
                          {alert.dias_atraso > 0 && (
                            <span className="text-red-500 ml-2">
                              ({alert.dias_atraso} días de atraso)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {getAlertBadge(alert.tipo)}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="font-heading text-xl">Acciones Rápidas</CardTitle>
            <CardDescription>Accesos directos a funciones frecuentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/clients" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2 hover:border-yellow-500 hover:bg-yellow-50"
                  data-testid="action-new-client"
                >
                  <Users className="w-6 h-6" />
                  <span>Nuevo Cliente</span>
                </Button>
              </Link>
              <Link to="/cobranza" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2 hover:border-yellow-500 hover:bg-yellow-50"
                  data-testid="action-cobranza"
                >
                  <Wallet className="w-6 h-6" />
                  <span>Registrar Pago</span>
                </Button>
              </Link>
              <Link to="/credits" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2 hover:border-yellow-500 hover:bg-yellow-50"
                  data-testid="action-credits"
                >
                  <CreditCard className="w-6 h-6" />
                  <span>Ver Créditos</span>
                </Button>
              </Link>
              <Link to="/cashbox" className="block">
                <Button
                  variant="outline"
                  className="w-full h-20 flex-col gap-2 hover:border-yellow-500 hover:bg-yellow-50"
                  data-testid="action-cashbox"
                >
                  <DollarSign className="w-6 h-6" />
                  <span>Cierre de Caja</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
