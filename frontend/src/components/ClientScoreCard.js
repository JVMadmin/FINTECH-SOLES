import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  CreditCard,
  Calendar,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SCORE_COLORS = {
  green: "bg-green-500",
  blue: "bg-blue-500",
  yellow: "bg-yellow-500",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const SCORE_BG_COLORS = {
  green: "bg-green-50 border-green-200",
  blue: "bg-blue-50 border-blue-200",
  yellow: "bg-yellow-50 border-yellow-200",
  orange: "bg-orange-50 border-orange-200",
  red: "bg-red-50 border-red-200",
};

const SCORE_TEXT_COLORS = {
  green: "text-green-700",
  blue: "text-blue-700",
  yellow: "text-yellow-700",
  orange: "text-orange-700",
  red: "text-red-700",
};

export default function ClientScoreCard({ clientId, clientName }) {
  const [scoreData, setScoreData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchScore = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API}/clients/${clientId}/score`);
      setScoreData(response.data);
    } catch (error) {
      toast.error("Error al calcular score del cliente");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      fetchScore();
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Calculando score...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scoreData) {
    return (
      <Card>
        <CardContent className="p-6">
          <Button onClick={fetchScore} variant="outline" className="w-full">
            <Star className="w-4 h-4 mr-2" />
            Calcular Score del Cliente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { score, categoria, color, recomendacion, metricas } = scoreData;

  return (
    <Card className={`border-2 ${SCORE_BG_COLORS[color]}`} data-testid="client-score-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className={`w-5 h-5 ${SCORE_TEXT_COLORS[color]}`} />
            Score Interno
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchScore}
            data-testid="refresh-score-btn"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score Principal */}
        <div className="text-center">
          <div className={`text-5xl font-bold ${SCORE_TEXT_COLORS[color]}`}>
            {score}
          </div>
          <Badge className={`${SCORE_COLORS[color]} text-white mt-2`}>
            {categoria}
          </Badge>
        </div>

        {/* Barra de Progreso */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>0</span>
            <span>50</span>
            <span>100</span>
          </div>
          <Progress value={score} className="h-3" />
        </div>

        {/* Recomendación */}
        <div className={`p-3 rounded-lg ${SCORE_BG_COLORS[color]} border`}>
          <p className={`text-sm ${SCORE_TEXT_COLORS[color]}`}>
            {recomendacion}
          </p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="w-4 h-4 text-blue-500" />
            <span className="text-gray-600">Créditos:</span>
            <span className="font-medium">{metricas.total_creditos}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Liquidados:</span>
            <span className="font-medium">{metricas.creditos_liquidados}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">A tiempo:</span>
            <span className="font-medium">{metricas.pagos_a_tiempo}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Atrasados:</span>
            <span className="font-medium">{metricas.pagos_atrasados}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-orange-500" />
            <span className="text-gray-600">Incidencias:</span>
            <span className="font-medium">{metricas.total_incidencias}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-gray-600">Prom. atraso:</span>
            <span className="font-medium">{metricas.promedio_dias_atraso}d</span>
          </div>
        </div>

        {/* Créditos vencidos warning */}
        {metricas.creditos_vencidos > 0 && (
          <div className="flex items-center gap-2 p-2 bg-red-100 rounded-lg text-red-700 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>{metricas.creditos_vencidos} crédito(s) vencido(s)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
