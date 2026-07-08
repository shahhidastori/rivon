import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BedDouble,
  BookOpenCheck,
  ChevronsLeft,
  ChevronsRight,
  LayoutDashboard,
  LogOut,
  PanelLeft,
  UserCog,
  Users,
  Wand2
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useBrandLogo } from "../hooks/useBrandLogo";
import { AdminShellSkeleton } from "./Skeletons";

export function AdminLayout() {
  const { admin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("rivon-admin-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });
  const logoUrl = useBrandLogo();

  useEffect(() => {
    try {
      localStorage.setItem("rivon-admin-sidebar-collapsed", String(collapsed));
    } catch {
      // Ignore storage errors in restricted browser modes.
    }
  }, [collapsed]);

  if (loading) return <AdminShellSkeleton />;
  if (!admin) return <Navigate to="/admin/login" replace />;

  const navItems = [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Rooms", "/admin/rooms", BedDouble],
    ["Bookings", "/admin/bookings", BookOpenCheck],
    ["Customers", "/admin/customers", Users],
    ["Analytics", "/admin/analytics", BarChart3],
    ["CMS", "/admin/cms", Wand2],
    ["Admin User", "/admin/profile", UserCog]
  ] as const;

  const seededPlaceholderName = ["Hotel", "Admin"].join(" ");
  const displayName = admin.name === seededPlaceholderName ? "Actual User name" : admin.name;

  return (
    <div className={collapsed ? "admin-shell admin-shell-collapsed" : "admin-shell"}>
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-sidebar-header">
          <div className="admin-logo">
            <img src={logoUrl} alt="Hotel logo" />
          </div>
          <button
            type="button"
            className="admin-collapse-button"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expand admin menu" : "Collapse admin menu"}
            title={collapsed ? "Expand menu" : "Collapse menu"}
          >
            {collapsed ? <ChevronsRight size={17} /> : <ChevronsLeft size={17} />}
          </button>
        </div>
        <nav>
          {navItems.map(([label, href, Icon]) => (
            <NavLink
              key={href}
              to={href}
              end={href === "/admin"}
              onClick={() => setOpen(false)}
              aria-label={label}
              data-label={label}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Open admin menu">
            <PanelLeft size={20} />
          </button>
          <div>
            <strong>{displayName}</strong>
            <span>{admin.role}</span>
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => {
              logout();
              navigate("/admin/login");
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
