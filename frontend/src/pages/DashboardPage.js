import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Briefcase,
  RefreshCw,
  Target,
  TrendingDown,
  Banknote,
  Timer,
  User,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function DashboardPage() {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [carteraRegional, setCarteraRegional] = useState(null);
  const [supervisorDashboard, setSupervisorDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSupervisorView = hasRole(["supervisor", "gerente_regional"]);

  const fetchData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    
    try {
      const promises = [
        axios.get(`${API}/stats/dashboard`),
        axios.get(`${API}/alerts`),
      ];
      
      // Si es supervisor, cargar dashboard especial
      if (isSupervisorView) {
        promises.push(axios.get(`${API}/stats/supervisor-dashboard`));
        promises.push(axios.get(`${API}/stats/cartera-regional`));
      }
      
      const results = await Promise.all(promises);
      setStats(results[0].data);
      setAlerts(results[1].data);
      
      if (isSupervisorView && results[2]) {
        setSupervisorDashboard(results[2].data);
      }
      if (isSupervisorView && results[3]) {
        setCarteraRegional(results[3].data);
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      if (!showRefresh) {
        toast.error("Error al cargar datos del dashboard");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSupervisorView]);

  useEffect(() => {
    fetchData();
    
    // Auto-refresh cada 30 segundos para supervisores
    if (isSupervisorView) {
      const interval = setInterval(() => {
        fetchData(true);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchData, isSupervisorView]);

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
        <div className="flex gap-3 items-center">
          {isSupervisorView && lastUpdate && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Actualizado: {lastUpdate.toLocaleTimeString("es-MX")}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fetchData(true)}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          )}
          <Link to="/clients">
            <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-client-btn">
              <Users className="w-4 h-4 mr-2" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* Supervisor Real-Time Metrics */}
      {isSupervisorView && supervisorDashboard && (
        <>
          {/* Performance Card */}
          <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-white" data-testid="performance-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-xl uppercase flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600" />
                Rendimiento del Día
                <Badge className="ml-auto bg-green-100 text-green-800 animate-pulse">
                  EN VIVO
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-white rounded-xl border">
                  <p className="text-sm text-gray-500">Cobrado Hoy</p>
                  <p className="font-heading text-2xl font-bold text-green-600">
                    {formatCurrency(supervisorDashboard.metricas.monto_cobrado_hoy)}
                  </p>
                  <p className="text-xs text-gray-400">
                    de {formatCurrency(supervisorDashboard.metricas.monto_esperado_hoy)} esperado
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border">
                  <p className="text-sm text-gray-500">Pagos Realizados</p>
                  <p className="font-heading text-2xl font-bold text-blue-600">
                    {supervisorDashboard.metricas.pagos_realizados_hoy}
                  </p>
                  <p className="text-xs text-gray-400">
                    de {supervisorDashboard.metricas.pagos_esperados_hoy} esperados
                  </p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border">
                  <p className="text-sm text-gray-500">% de Cobro</p>
                  <p className={`font-heading text-2xl font-bold ${
                    supervisorDashboard.metricas.porcentaje_cobro >= 80 ? "text-green-600" :
                    supervisorDashboard.metricas.porcentaje_cobro >= 50 ? "text-yellow-600" : "text-red-600"
                  }`}>
                    {supervisorDashboard.metricas.porcentaje_cobro}%
                  </p>
                  <Progress 
                    value={supervisorDashboard.metricas.porcentaje_cobro} 
                    className="mt-2 h-2"
                  />
                </div>
                <div className="text-center p-4 bg-white rounded-xl border">
                  <p className="text-sm text-gray-500">Pagos Atrasados</p>
                  <p className={`font-heading text-2xl font-bold ${
                    supervisorDashboard.metricas.pagos_atrasados > 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {supervisorDashboard.metricas.pagos_atrasados}
                  </p>
                  <p className="text-xs text-gray-400">requieren atención</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alertas de Cobranza */}
            <Card className="border-l-4 border-l-red-500" data-testid="cobranza-alerts">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Alertas de Cobranza
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supervisorDashboard.alertas.atrasados.length === 0 && supervisorDashboard.alertas.hoy.length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <p>¡Sin alertas pendientes!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {supervisorDashboard.alertas.atrasados.slice(0, 5).map((alerta, i) => (
                      <Link
                        key={`atrasado-${i}`}
                        to={`/credits/${alerta.credito_id}`}
                        className="flex items-center justify-between p-2 bg-red-50 rounded-lg hover:bg-red-100"
                      >
                        <div>
                          <p className="font-medium text-sm">{alerta.cliente_nombre}</p>
                          <p className="text-xs text-red-600">{alerta.dias_atraso} días de atraso</p>
                        </div>
                        <Badge className="bg-red-100 text-red-800">
                          {formatCurrency(alerta.monto)}
                        </Badge>
                      </Link>
                    ))}
                    {supervisorDashboard.alertas.hoy.slice(0, 3).map((alerta, i) => (
                      <Link
                        key={`hoy-${i}`}
                        to={`/credits/${alerta.credito_id}`}
                        className="flex items-center justify-between p-2 bg-blue-50 rounded-lg hover:bg-blue-100"
                      >
                        <div>
                          <p className="font-medium text-sm">{alerta.cliente_nombre}</p>
                          <p className="text-xs text-blue-600">Vence hoy</p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {formatCurrency(alerta.monto)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                <Link to="/cobranza" className="block mt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver toda la cobranza <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Desembolsos Pendientes */}
            <Card className="border-l-4 border-l-green-500" data-testid="desembolsos-pendientes">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="w-5 h-5 text-green-500" />
                  Desembolsos Pendientes
                  {supervisorDashboard.metricas.desembolsos_pendientes > 0 && (
                    <Badge className="bg-green-600 text-white ml-auto">
                      {supervisorDashboard.metricas.desembolsos_pendientes}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {supervisorDashboard.desembolsos_pendientes.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Timer className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>Sin desembolsos pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {supervisorDashboard.desembolsos_pendientes.map((desembolso, i) => (
                      <Link
                        key={i}
                        to={`/credits/${desembolso.id}`}
                        className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100"
                      >
                        <div>
                          <p className="font-medium text-sm">{desembolso.cliente_nombre}</p>
                          <p className="text-xs text-gray-500">
                            Autorizado: {desembolso.fecha_autorizacion?.split("T")[0] || "Hoy"}
                          </p>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {formatCurrency(desembolso.monto)}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
                <Link to="/credits?estatus=autorizado" className="block mt-3">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Rendimiento por Asesor */}
          {supervisorDashboard.rendimiento_asesores?.length > 0 && (
            <Card data-testid="rendimiento-asesores">
              <CardHeader>
                <CardTitle className="font-heading text-xl flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                  Rendimiento de Asesores (Hoy)
                </CardTitle>
                <CardDescription>Ordenado por monto cobrado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {supervisorDashboard.rendimiento_asesores.map((asesor, index) => (
                    <div
                      key={asesor.id}
                      className={`p-4 rounded-xl border ${
                        index === 0 ? "border-yellow-300 bg-yellow-50" :
                        index === 1 ? "border-gray-300 bg-gray-50" :
                        index === 2 ? "border-orange-200 bg-orange-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          index === 0 ? "bg-yellow-200 text-yellow-800" :
                          index === 1 ? "bg-gray-200 text-gray-800" :
                          index === 2 ? "bg-orange-200 text-orange-800" : "bg-blue-100 text-blue-800"
                        }`}>
                          {index < 3 ? (
                            <span className="font-bold">{index + 1}°</span>
                          ) : (
                            <User className="w-5 h-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{asesor.nombre}</p>
                          {asesor.region && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {asesor.region}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div className="p-2 bg-white rounded-lg">
                          <p className="text-xs text-gray-500">Cobrado</p>
                          <p className="font-bold text-green-600">{formatCurrency(asesor.monto_cobrado)}</p>
                        </div>
                        <div className="p-2 bg-white rounded-lg">
                          <p className="text-xs text-gray-500">Pagos</p>
                          <p className="font-bold text-blue-600">{asesor.pagos_realizados}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Standard Stats Grid (for all roles) */}
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

      {/* Alerts and Quick Actions (for non-supervisor or as additional info) */}
      {!isSupervisorView && (
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
      )}

      {/* Quick Actions for Supervisor (smaller at bottom) */}
      {isSupervisorView && (
        <Card data-testid="quick-actions-supervisor">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link to="/cobranza" className="block">
                <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:border-yellow-500 hover:bg-yellow-50">
                  <Wallet className="w-5 h-5" />
                  <span className="text-xs">Cobranza</span>
                </Button>
              </Link>
              <Link to="/credits?estatus=pendiente" className="block">
                <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:border-yellow-500 hover:bg-yellow-50">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs">Por Autorizar</span>
                </Button>
              </Link>
              <Link to="/cashbox" className="block">
                <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:border-yellow-500 hover:bg-yellow-50">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-xs">Caja Regional</span>
                </Button>
              </Link>
              <Link to="/cartera" className="block">
                <Button variant="outline" className="w-full h-16 flex-col gap-1 hover:border-yellow-500 hover:bg-yellow-50">
                  <Briefcase className="w-5 h-5" />
                  <span className="text-xs">Cartera</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
