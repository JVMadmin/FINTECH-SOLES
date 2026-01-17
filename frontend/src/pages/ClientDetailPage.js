import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Phone,
  MapPin,
  User,
  Camera,
  CreditCard,
  Edit,
  Save,
  X,
  Plus,
  Trash2,
  Navigation,
  Image as ImageIcon,
  Home,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import ClientScoreCard from "@/components/ClientScoreCard";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [client, setClient] = useState(null);
  const [credits, setCredits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [newReference, setNewReference] = useState({ nombre: "", telefono: "", relacion: "" });
  const fileInputRef = useRef(null);
  const [uploadType, setUploadType] = useState("");

  useEffect(() => {
    fetchClient();
    fetchCredits();
  }, [id]);

  const fetchClient = async () => {
    try {
      const response = await axios.get(`${API}/clients/${id}`);
      setClient(response.data);
      setEditData(response.data);
    } catch (error) {
      toast.error("Error al cargar cliente");
      navigate("/clients");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCredits = async () => {
    try {
      const response = await axios.get(`${API}/credits?cliente_id=${id}`);
      setCredits(response.data);
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const handleSave = async () => {
    try {
      await axios.put(`${API}/clients/${id}`, editData);
      toast.success("Cliente actualizado");
      setIsEditing(false);
      fetchClient();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar");
    }
  };

  const handleAddReference = () => {
    if (!newReference.nombre || !newReference.telefono) {
      toast.error("Ingrese nombre y teléfono de la referencia");
      return;
    }
    const referencias = [...(editData.referencias || []), newReference];
    setEditData({ ...editData, referencias });
    setNewReference({ nombre: "", telefono: "", relacion: "" });
  };

  const handleRemoveReference = (index) => {
    const referencias = editData.referencias.filter((_, i) => i !== index);
    setEditData({ ...editData, referencias });
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

      const fieldMap = {
        cliente: "foto_cliente",
        domicilio: "foto_domicilio",
        negocio: "foto_negocio",
      };

      const field = fieldMap[uploadType];
      if (field) {
        await axios.put(`${API}/clients/${id}`, { [field]: response.data.url });
        toast.success("Foto subida exitosamente");
        fetchClient();
      }
    } catch (error) {
      toast.error("Error al subir foto");
    }
  };

  const handleSetLocation = async (type) => {
    if (!navigator.geolocation) {
      toast.error("Geolocalización no disponible");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        const field = type === "domicilio" ? "coordenadas_domicilio" : "coordenadas_negocio";

        try {
          await axios.put(`${API}/clients/${id}`, { [field]: coords });
          toast.success("Ubicación guardada");
          fetchClient();
        } catch (error) {
          toast.error("Error al guardar ubicación");
        }
      },
      (error) => {
        toast.error("Error al obtener ubicación");
      }
    );
  };

  const openInMaps = (coords) => {
    if (!coords) return;
    window.open(`https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}&zoom=17`, "_blank");
  };

  const getStatusBadge = (estatus) => {
    switch (estatus) {
      case "vigente":
        return <Badge className="status-vigente">Vigente</Badge>;
      case "atrasado":
        return <Badge className="status-atrasado">Atrasado</Badge>;
      case "vencido":
        return <Badge className="status-vencido">Vencido</Badge>;
      default:
        return <Badge className="status-pendiente">{estatus}</Badge>;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount || 0);
  };

  const hasAllEvidence = () => {
    return (
      client?.foto_cliente &&
      client?.foto_domicilio &&
      client?.foto_negocio &&
      client?.coordenadas_domicilio &&
      client?.coordenadas_negocio
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="space-y-6 animate-fade-in" data-testid="client-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate("/clients")} data-testid="back-btn">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Client Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="font-heading text-2xl uppercase flex items-center gap-3">
                {client.nombre_completo}
                {getStatusBadge(client.estatus)}
              </CardTitle>
              <CardDescription>
                Creado el {new Date(client.created_at).toLocaleDateString()}
                {client.asesor_nombre && ` • Asesor: ${client.asesor_nombre}`}
              </CardDescription>
            </div>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)} data-testid="edit-client-btn">
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditData(client); }}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button className="bg-yellow-600 hover:bg-yellow-700" onClick={handleSave} data-testid="save-client-btn">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isEditing ? (
              <>
                <div className="space-y-2">
                  <Label>Nombre Completo</Label>
                  <Input
                    value={editData.nombre_completo}
                    onChange={(e) => setEditData({ ...editData, nombre_completo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input
                    value={editData.telefono}
                    onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Dirección</Label>
                  <Textarea
                    value={editData.direccion}
                    onChange={(e) => setEditData({ ...editData, direccion: e.target.value })}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <a href={`tel:${client.telefono}`} className="text-blue-600 font-medium hover:underline">
                        {client.telefono}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Región</p>
                      <p className="font-medium capitalize">{client.region}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Dirección</p>
                  <p className="text-gray-900">{client.direccion}</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="evidencias" className="w-full">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="evidencias" data-testid="tab-evidencias">Evidencias</TabsTrigger>
          <TabsTrigger value="referencias" data-testid="tab-referencias">Referencias</TabsTrigger>
          <TabsTrigger value="creditos" data-testid="tab-creditos">Créditos</TabsTrigger>
        </TabsList>

        {/* Evidencias Tab */}
        <TabsContent value="evidencias" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Foto Cliente */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Foto del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.foto_cliente ? (
                  <div className="relative">
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${client.foto_cliente}`}
                      alt="Cliente"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => { setUploadType("cliente"); fileInputRef.current?.click(); }}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-48 flex-col gap-2"
                    onClick={() => { setUploadType("cliente"); fileInputRef.current?.click(); }}
                    data-testid="upload-foto-cliente"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-500">Subir Foto</span>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Foto Domicilio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Foto del Domicilio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.foto_domicilio ? (
                  <div className="relative">
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${client.foto_domicilio}`}
                      alt="Domicilio"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => { setUploadType("domicilio"); fileInputRef.current?.click(); }}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-48 flex-col gap-2"
                    onClick={() => { setUploadType("domicilio"); fileInputRef.current?.click(); }}
                    data-testid="upload-foto-domicilio"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-500">Subir Foto</span>
                  </Button>
                )}
                <div className="mt-2 flex gap-2">
                  {client.coordenadas_domicilio ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openInMaps(client.coordenadas_domicilio)}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Ver Mapa
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSetLocation("domicilio")}
                      data-testid="set-location-domicilio"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Guardar GPS
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Foto Negocio */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  Foto del Negocio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.foto_negocio ? (
                  <div className="relative">
                    <img
                      src={`${process.env.REACT_APP_BACKEND_URL}${client.foto_negocio}`}
                      alt="Negocio"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      size="sm"
                      className="absolute bottom-2 right-2"
                      onClick={() => { setUploadType("negocio"); fileInputRef.current?.click(); }}
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full h-48 flex-col gap-2"
                    onClick={() => { setUploadType("negocio"); fileInputRef.current?.click(); }}
                    data-testid="upload-foto-negocio"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-500">Subir Foto</span>
                  </Button>
                )}
                <div className="mt-2 flex gap-2">
                  {client.coordenadas_negocio ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openInMaps(client.coordenadas_negocio)}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Ver Mapa
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleSetLocation("negocio")}
                      data-testid="set-location-negocio"
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Guardar GPS
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {!hasAllEvidence() && (
            <Card className="mt-4 border-yellow-200 bg-yellow-50">
              <CardContent className="p-4">
                <p className="text-yellow-800 text-sm">
                  <strong>Nota:</strong> Se requieren todas las evidencias (fotos y coordenadas GPS) para poder solicitar un crédito.
                </p>
              </CardContent>
            </Card>
          )}

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileUpload}
          />
        </TabsContent>

        {/* Referencias Tab */}
        <TabsContent value="referencias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Referencias Personales</CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <p className="font-medium text-sm">Agregar Referencia</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Input
                      placeholder="Nombre"
                      value={newReference.nombre}
                      onChange={(e) => setNewReference({ ...newReference, nombre: e.target.value })}
                    />
                    <Input
                      placeholder="Teléfono"
                      value={newReference.telefono}
                      onChange={(e) => setNewReference({ ...newReference, telefono: e.target.value })}
                    />
                    <Input
                      placeholder="Relación (ej: vecino)"
                      value={newReference.relacion}
                      onChange={(e) => setNewReference({ ...newReference, relacion: e.target.value })}
                    />
                  </div>
                  <Button onClick={handleAddReference} size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Agregar
                  </Button>
                </div>
              )}

              {(isEditing ? editData.referencias : client.referencias)?.length > 0 ? (
                <div className="space-y-3">
                  {(isEditing ? editData.referencias : client.referencias).map((ref, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{ref.nombre}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <a href={`tel:${ref.telefono}`} className="text-blue-600 hover:underline flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {ref.telefono}
                          </a>
                          {ref.relacion && <span>({ref.relacion})</span>}
                        </div>
                      </div>
                      {isEditing && (
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveReference(index)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No hay referencias registradas</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Créditos Tab */}
        <TabsContent value="creditos" className="mt-6 space-y-6">
          {/* Score Card */}
          <ClientScoreCard clientId={id} clientName={client?.nombre_completo} />
          
          {/* Credits History */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Historial de Créditos</CardTitle>
                {hasAllEvidence() && (
                  <Link to={`/credits?new=true&cliente_id=${id}`}>
                    <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-credit-btn">
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo Crédito
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {credits.length > 0 ? (
                <div className="space-y-3">
                  {credits.map((credit) => (
                    <Link key={credit.id} to={`/credits/${credit.id}`}>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{formatCurrency(credit.monto_otorgado)}</span>
                            {getStatusBadge(credit.estatus)}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {credit.tipo_credito} • {credit.plazo} pagos • Inicio: {credit.fecha_inicio}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Saldo</p>
                          <p className="font-medium">{formatCurrency(credit.saldo_pendiente)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-500">No hay créditos registrados</p>
                  {!hasAllEvidence() && (
                    <p className="text-sm text-yellow-600 mt-2">
                      Complete las evidencias para solicitar un crédito
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
