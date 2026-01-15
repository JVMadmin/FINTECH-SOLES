import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, LogIn, User, Lock } from "lucide-react";

const LOGO_URL = "https://customer-assets.emergentagent.com/job_fintech-soles/artifacts/2td609sq_506457094_29841105905504484_1973994614841110561_n.png";
const BG_IMAGE = "https://images.unsplash.com/photo-1758518727707-b023e285b709?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxODF8MHwxfHNlYXJjaHwxfHxmaW5hbmNlJTIwdGVhbSUyMG1lZXRpbmclMjBwcm9mZXNzaW9uYWwlMjBvZmZpY2V8ZW58MHx8fHwxNzY4NTA2NDYyfDA&ixlib=rb-4.1.0&q=85";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Por favor ingrese usuario y contraseña");
      return;
    }

    setIsLoading(true);

    const result = await login(username, password);

    setIsLoading(false);

    if (result.success) {
      toast.success("¡Bienvenido!");
      navigate("/dashboard");
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image (hidden on mobile) */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{ backgroundImage: `url(${BG_IMAGE})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/90 to-gray-900/70" />
        <div className="relative z-10 flex flex-col justify-center p-12 text-white">
          <img src={LOGO_URL} alt="SOLES" className="w-24 h-24 mb-8" />
          <h1 className="font-heading text-5xl font-bold uppercase tracking-tight mb-4">
            SOLES CORPORATIVO
          </h1>
          <p className="text-xl text-gray-300 max-w-md">
            Sistema integral de gestión de créditos y cobranza
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <span className="text-gray-300">Control total de cartera</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-gray-300">Cobranza en tiempo real</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-300">Reportes y auditoría</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 bg-gray-100">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 text-center">
          <img src={LOGO_URL} alt="SOLES" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="font-heading text-3xl font-bold uppercase tracking-tight text-gray-900">
            SOLES
          </h1>
          <p className="text-sm text-gray-500 uppercase tracking-wider">Corporativo</p>
        </div>

        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="font-heading text-2xl text-center uppercase tracking-wide">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center">
              Ingrese sus credenciales para acceder al sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Usuario
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-12 text-lg"
                    data-testid="login-username"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-12 text-lg"
                    data-testid="login-password"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    data-testid="toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold uppercase tracking-wide bg-yellow-600 hover:bg-yellow-700"
                disabled={isLoading}
                data-testid="login-submit"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ingresando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="w-5 h-5" />
                    Ingresar
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                Usuarios de prueba:
              </p>
              <div className="mt-2 text-xs text-center text-gray-500 space-y-1">
                <p><strong>developer</strong> / developer123</p>
                <p><strong>admin</strong> / admin123</p>
                <p><strong>gerente_yajalon</strong> / gerente123</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="mt-8 text-xs text-gray-400 text-center">
          © 2024 SOLES CORPORATIVO. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}
