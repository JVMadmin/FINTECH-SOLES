import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  Users,
  CreditCard,
  Wallet,
  BarChart3,
  RefreshCw,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, exportToPDF, REPORT_CONFIGS } from "@/utils/exportReports";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REPORT_TYPES = [
  { 
    id: "cobranza", 
    name: "Cobranza del Día", 
    icon: Wallet, 
    color: "bg-green-100 text-green-800",
    description: "Pagos pendientes y atrasados del día"
  },
  { 
    id: "cartera", 
    name: "Cartera de Créditos", 
    icon: CreditCard, 
    color: "bg-blue-100 text-blue-800",
    description: "Todos los créditos activos con su estado"
  },
  { 
    id: "pagos", 
    name: "Historial de Pagos", 
    icon: BarChart3, 
    color: "bg-purple-100 text-purple-800",
    description: "Pagos registrados en un período"
  },
  { 
    id: "clientes", 
    name: "Lista de Clientes", 
    icon: Users, 
    color: "bg-orange-100 text-orange-800",
    description: "Directorio completo de clientes"
  },
];

const REGIONS = [
  { id: "all", nombre: "Todas las regiones" },
  { id: "yajalon", nombre: "Yajalón" },
  { id: "chilon", nombre: "Chilón" },
  { id: "bachajon", nombre: "Bachajón" },
  { id: "temo", nombre: "Temo" },
  { id: "petalcingo", nombre: "Petalcingo" },
  { id: "tumbala", nombre: "Tumbalá" },
  { id: "tila", nombre: "Tila" },
];

export default function ReportesPage() {
  const { user, hasRole } = useAuth();
  const [selectedReport, setSelectedReport] = useState("cobranza");
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [asesores, setAsesores] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    region: "all",
    asesor: "all",
    fechaInicio: new Date().toISOString().split("T")[0],
    fechaFin: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAsesores();
  }, []);

  const fetchAsesores = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setAsesores(response.data.filter(u => u.rol === "asesor" && u.activo));
    } catch (error) {
      console.error("Error fetching asesores:", error);
    }
  };

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      let endpoint = "";
      let params = new URLSearchParams();
      
      if (filters.region !== "all") params.append("region", filters.region);
      if (filters.asesor !== "all") params.append("asesor_id", filters.asesor);
      
      switch (selectedReport) {
        case "cobranza":
          endpoint = `${API}/alerts`;
          break;
        case "cartera":
          endpoint = `${API}/credits`;
          params.append("estatus", "vigente,atrasado");
          break;
        case "pagos":
          endpoint = `${API}/payments`;
          params.append("fecha_inicio", filters.fechaInicio);
          params.append("fecha_fin", filters.fechaFin);
          break;
        case "clientes":
          endpoint = `${API}/clients`;
          break;
        default:
          endpoint = `${API}/alerts`;
      }
      
      const response = await axios.get(`${endpoint}?${params.toString()}`);
      setReportData(response.data);
      toast.success(`Se cargaron ${response.data.length} registros`);
    } catch (error) {
      toast.error("Error al cargar datos del reporte");
      setReportData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    
    const config = REPORT_CONFIGS[selectedReport];
    exportToExcel(reportData, config.columns, `reporte_${selectedReport}`, config.title);
    toast.success("Reporte Excel generado");
  };

  const handleExportPDF = () => {
    if (reportData.length === 0) {
      toast.error("No hay datos para exportar");
      return;
    }
    
    const config = REPORT_CONFIGS[selectedReport];
    const summary = {
      "Total de registros": reportData.length,
      "Región": filters.region === "all" ? "Todas" : filters.region,
      "Fecha": new Date().toLocaleDateString("es-MX"),
    };
    
    exportToPDF(reportData, config.columns, `reporte_${selectedReport}`, config.title, summary);
    toast.success("Reporte PDF generado");
  };

  const currentReportConfig = REPORT_TYPES.find(r => r.id === selectedReport);

  return (
    <div className="space-y-6 animate-fade-in" data-testid="reportes-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Reportes
          </h1>
          <p className="text-gray-500 mt-1">
            Genera y exporta reportes en Excel o PDF
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Type Selection */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
              Tipo de Reporte
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {REPORT_TYPES.map((report) => {
              const Icon = report.icon;
              const isSelected = selectedReport === report.id;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReport(report.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected 
                      ? "border-yellow-500 bg-yellow-50" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  data-testid={`report-type-${report.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${report.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-gray-500">{report.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Filters and Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" />
              Filtros y Exportación
            </CardTitle>
            <CardDescription>
              {currentReportConfig?.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Región / Localidad</Label>
                <Select
                  value={filters.region}
                  onValueChange={(v) => setFilters({ ...filters, region: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
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

              <div className="space-y-2">
                <Label>Asesor</Label>
                <Select
                  value={filters.asesor}
                  onValueChange={(v) => setFilters({ ...filters, asesor: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
              </div>

              {selectedReport === "pagos" && (
                <>
                  <div className="space-y-2">
                    <Label>Fecha Inicio</Label>
                    <Input
                      type="date"
                      value={filters.fechaInicio}
                      onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fecha Fin</Label>
                    <Input
                      type="date"
                      value={filters.fechaFin}
                      onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Generate Report Button */}
            <Button
              onClick={fetchReportData}
              className="w-full bg-yellow-600 hover:bg-yellow-700"
              disabled={isLoading}
              data-testid="generate-report-btn"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Generar Reporte
                </>
              )}
            </Button>

            {/* Results Summary */}
            {reportData.length > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-green-800">
                      {reportData.length} registros encontrados
                    </p>
                    <p className="text-sm text-green-600">
                      Listo para exportar
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    {currentReportConfig?.name}
                  </Badge>
                </div>
              </div>
            )}

            {/* Export Buttons */}
            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                disabled={reportData.length === 0}
                data-testid="export-excel-btn"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Button
                onClick={handleExportPDF}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50"
                disabled={reportData.length === 0}
                data-testid="export-pdf-btn"
              >
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Preview */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vista Previa de Datos</CardTitle>
            <CardDescription>
              Mostrando los primeros 10 registros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    {REPORT_CONFIGS[selectedReport]?.columns.slice(0, 5).map((col) => (
                      <th key={col.key} className="px-4 py-2 text-left font-medium">
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 10).map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      {REPORT_CONFIGS[selectedReport]?.columns.slice(0, 5).map((col) => (
                        <td key={col.key} className="px-4 py-2">
                          {col.format === "currency" 
                            ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(row[col.key] || 0)
                            : col.format === "date"
                            ? row[col.key] ? new Date(row[col.key]).toLocaleDateString("es-MX") : "-"
                            : row[col.key] || "-"
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
