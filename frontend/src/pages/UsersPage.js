import { useState, useEffect } from "react";
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
  UserCircle,
  Plus,
  Search,
  Edit,
  Ban,
  Check,
  Shield,
  Key,
  Trash2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ROLES = [
  { value: "desarrollador", label: "Desarrollador", color: "bg-purple-100 text-purple-800" },
  { value: "administrador", label: "Administrador", color: "bg-blue-100 text-blue-800" },
  { value: "gerente_regional", label: "Gerente Regional", color: "bg-green-100 text-green-800" },
  { value: "supervisor", label: "Supervisor", color: "bg-yellow-100 text-yellow-800" },
  { value: "asesor", label: "Asesor de Crédito", color: "bg-gray-100 text-gray-800" },
];

const LOCALIDADES = [
  { id: "yajalon", nombre: "Yajalón (Sede Regional #3)", tipo: "sede" },
  { id: "chilon", nombre: "Chilón", tipo: "comunidad" },
  { id: "bachajon", nombre: "Bachajón", tipo: "comunidad" },
  { id: "temo", nombre: "Temo", tipo: "comunidad" },
  { id: "petalcingo", nombre: "Petalcingo", tipo: "comunidad" },
  { id: "tumbala", nombre: "Tumbalá", tipo: "comunidad" },
  { id: "tila", nombre: "Tila", tipo: "comunidad" },
];

export default function UsersPage() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    nombre_completo: "",
    rol: "",
    region: user?.region || "",
    telefono: "",
  });
  const [editUser, setEditUser] = useState({
    nombre_completo: "",
    telefono: "",
    region: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password || !newUser.nombre_completo || !newUser.rol) {
      toast.error("Por favor complete todos los campos obligatorios");
      return;
    }

    // Validate region for operational roles
    if (["gerente_regional", "supervisor", "asesor"].includes(newUser.rol) && !newUser.region) {
      toast.error("Los roles operativos requieren una región");
      return;
    }

    try {
      await axios.post(`${API}/users`, newUser);
      toast.success("Usuario creado exitosamente");
      setIsDialogOpen(false);
      setNewUser({
        username: "",
        password: "",
        nombre_completo: "",
        rol: "",
        region: user?.region || "",
        telefono: "",
      });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al crear usuario");
    }
  };

  const handleToggleActive = async (userId, currentActive) => {
    try {
      if (currentActive) {
        await axios.delete(`${API}/users/${userId}`);
        toast.success("Usuario desactivado");
      } else {
        await axios.put(`${API}/users/${userId}`, { activo: true });
        toast.success("Usuario activado");
      }
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleOpenEdit = (userToEdit) => {
    setSelectedUser(userToEdit);
    setEditUser({
      nombre_completo: userToEdit.nombre_completo,
      telefono: userToEdit.telefono || "",
      region: userToEdit.region || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`${API}/users/${selectedUser.id}`, editUser);
      toast.success("Usuario actualizado");
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al actualizar usuario");
    }
  };

  const handleOpenPasswordChange = (userToEdit) => {
    setSelectedUser(userToEdit);
    setNewPassword("");
    setIsPasswordDialogOpen(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    try {
      await axios.put(`${API}/users/${selectedUser.id}`, { password: newPassword });
      toast.success("Contraseña actualizada");
      setIsPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al cambiar contraseña");
    }
  };

  const handleOpenDelete = (userToDelete) => {
    setSelectedUser(userToDelete);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteUser = async () => {
    try {
      await axios.delete(`${API}/users/${selectedUser.id}`);
      toast.success("Usuario eliminado");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al eliminar usuario");
    }
  };

  const canEditUser = (targetUser) => {
    // No puede editarse a sí mismo desde aquí
    if (targetUser.id === user?.id) return false;
    
    // Desarrollador puede editar a todos
    if (hasRole("desarrollador")) return true;
    
    // Admin puede editar a todos menos desarrolladores
    if (hasRole("administrador") && targetUser.rol !== "desarrollador") return true;
    
    // Gerente regional puede editar supervisores y asesores de su región
    if (hasRole("gerente_regional") && 
        ["supervisor", "asesor"].includes(targetUser.rol) && 
        targetUser.region === user?.region) return true;
    
    // Supervisor puede editar asesores de su equipo
    if (hasRole("supervisor") && 
        targetUser.rol === "asesor" && 
        targetUser.supervisor_id === user?.id) return true;
    
    return false;
  };

  const getLocalidadName = (id) => {
    const loc = LOCALIDADES.find(l => l.id === id);
    return loc ? loc.nombre : id || "-";
  };

  const getRoleBadge = (rol) => {
    const roleConfig = ROLES.find((r) => r.value === rol);
    return (
      <Badge className={roleConfig?.color || "bg-gray-100 text-gray-800"}>
        {roleConfig?.label || rol}
      </Badge>
    );
  };

  const getAvailableRoles = () => {
    if (hasRole("desarrollador")) return ROLES;
    if (hasRole("administrador")) return ROLES.filter(r => r.value !== "desarrollador");
    if (hasRole("gerente_regional")) return ROLES.filter(r => ["supervisor", "asesor"].includes(r.value));
    if (hasRole("supervisor")) return ROLES.filter(r => r.value === "asesor");
    return [];
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || u.rol === filterRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 animate-fade-in" data-testid="users-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 uppercase tracking-tight">
            Usuarios
          </h1>
          <p className="text-gray-500 mt-1">{filteredUsers.length} usuarios registrados</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-yellow-600 hover:bg-yellow-700" data-testid="new-user-btn">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl uppercase">Nuevo Usuario</DialogTitle>
              <DialogDescription>
                Cree una nueva cuenta de usuario para el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nombre de Usuario *</Label>
                <Input
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="nombre_usuario"
                  data-testid="user-username-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Contraseña *</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="••••••••"
                  data-testid="user-password-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Nombre Completo *</Label>
                <Input
                  value={newUser.nombre_completo}
                  onChange={(e) => setNewUser({ ...newUser, nombre_completo: e.target.value })}
                  placeholder="Nombre completo"
                  data-testid="user-name-input"
                />
              </div>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <Select
                  value={newUser.rol}
                  onValueChange={(value) => setNewUser({ ...newUser, rol: value })}
                >
                  <SelectTrigger data-testid="user-role-select">
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableRoles().map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {["gerente_regional", "supervisor", "asesor"].includes(newUser.rol) && (
                <div className="space-y-2">
                  <Label>Localidad *</Label>
                  <Select
                    value={newUser.region}
                    onValueChange={(value) => setNewUser({ ...newUser, region: value })}
                    disabled={hasRole(["supervisor", "gerente_regional"])}
                  >
                    <SelectTrigger data-testid="user-region-select">
                      <SelectValue placeholder="Seleccionar localidad" />
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
              )}
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={newUser.telefono}
                  onChange={(e) => setNewUser({ ...newUser, telefono: e.target.value })}
                  placeholder="Número de teléfono"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-yellow-600 hover:bg-yellow-700"
                onClick={handleCreateUser}
                data-testid="save-user-btn"
              >
                Crear Usuario
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
                placeholder="Buscar por nombre o usuario..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-users"
              />
            </div>
            <Select value={filterRole || "all"} onValueChange={(v) => setFilterRole(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Localidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-pulse">Cargando...</div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((u) => (
                  <TableRow key={u.id} className="table-row-hover" data-testid={`user-row-${u.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-gray-500" />
                        </div>
                        <span className="font-mono text-sm">{u.username}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{u.nombre_completo}</TableCell>
                    <TableCell>{getRoleBadge(u.rol)}</TableCell>
                    <TableCell>
                      {u.region ? (
                        <Badge variant="outline" className="text-xs">
                          <MapPin className="w-3 h-3 mr-1" />
                          {getLocalidadName(u.region)}
                        </Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {u.activo ? (
                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">Inactivo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEditUser(u) && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(u)}
                              title="Editar usuario"
                              data-testid={`edit-user-${u.id}`}
                            >
                              <Edit className="w-4 h-4 text-blue-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPasswordChange(u)}
                              title="Cambiar contraseña"
                              data-testid={`password-user-${u.id}`}
                            >
                              <Key className="w-4 h-4 text-yellow-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(u.id, u.activo)}
                              title={u.activo ? "Desactivar" : "Activar"}
                              data-testid={`toggle-user-${u.id}`}
                            >
                              {u.activo ? (
                                <Ban className="w-4 h-4 text-red-500" />
                              ) : (
                                <Check className="w-4 h-4 text-green-500" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Role Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Permisos por Rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-purple-50 rounded-lg">
              <p className="font-medium text-purple-800">Desarrollador</p>
              <p className="text-purple-600 text-xs mt-1">Acceso total, configuración del sistema</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-800">Administrador</p>
              <p className="text-blue-600 text-xs mt-1">Gestión de usuarios, reportes globales</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="font-medium text-green-800">Gerente Regional</p>
              <p className="text-green-600 text-xs mt-1">Autoriza créditos, ve cartera regional</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="font-medium text-yellow-800">Supervisor</p>
              <p className="text-yellow-600 text-xs mt-1">Asigna cartera, valida información</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-800">Asesor de Crédito</p>
              <p className="text-gray-600 text-xs mt-1">Alta clientes, registra pagos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
