import { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  UserCircle,
  Briefcase,
  Receipt,
  History,
  MapPin,
  Home,
  Banknote,
  Bell,
  Check,
  CheckCheck,
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LOGO_URL = "https://customer-assets.emergentagent.com/job_fintech-soles/artifacts/2td609sq_506457094_29841105905504484_1973994614841110561_n.png";

const MainLayout = ({ children }) => {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Clientes",
      icon: Users,
      path: "/clients",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Créditos",
      icon: CreditCard,
      path: "/credits",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Cobranza",
      icon: Wallet,
      path: "/cobranza",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Cartera",
      icon: Briefcase,
      path: "/cartera",
      roles: ["desarrollador", "administrador", "supervisor"],
    },
    {
      label: "Caja",
      icon: Receipt,
      path: "/cashbox",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Desembolsos",
      icon: Banknote,
      path: "/desembolsos",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor", "asesor"],
    },
    {
      label: "Usuarios",
      icon: UserCircle,
      path: "/users",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor"],
    },
    {
      label: "Auditoría",
      icon: History,
      path: "/logs",
      roles: ["desarrollador", "administrador"],
    },
    {
      label: "Asignaciones",
      icon: MapPin,
      path: "/asignaciones",
      roles: ["desarrollador", "administrador", "gerente_regional", "supervisor"],
    },
  ];

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

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

  const NavLink = ({ item, onClick }) => {
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
    const Icon = item.icon;

    return (
      <Link
        to={item.path}
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-yellow-600 text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
        data-testid={`nav-${item.label.toLowerCase()}`}
      >
        <Icon className="w-5 h-5" />
        <span className="font-medium">{item.label}</span>
      </Link>
    );
  };

  // Mobile bottom navigation items (limited)
  const mobileNavItems = filteredNavItems.slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-gray-200 z-30">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-200">
          <img src={LOGO_URL} alt="SOLES" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="font-heading font-bold text-lg text-gray-900 uppercase tracking-wide">
              SOLES
            </h1>
            <p className="text-xs text-gray-500 uppercase tracking-wider">Corporativo</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => (
            <NavLink key={item.path} item={item} />
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 truncate">
                {user?.nombre_completo}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {getRoleName(user?.rol)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="SOLES" className="w-8 h-8 object-contain" />
          <span className="font-heading font-bold text-lg text-gray-900 uppercase">
            SOLES
          </span>
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="mobile-menu-btn">
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <UserCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{user?.nombre_completo}</p>
                  <p className="text-xs text-gray-500">{getRoleName(user?.rol)}</p>
                </div>
              </div>
            </div>
            <nav className="p-3 space-y-1">
              {filteredNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  item={item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </nav>
            <div className="p-3 border-t border-gray-200">
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16 lg:pt-0 pb-20 lg:pb-0 min-h-screen">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 bottom-nav pb-safe">
        <div className="flex justify-around items-center h-16">
          {mobileNavItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? "text-yellow-600" : "text-gray-500"
                }`}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MainLayout;
