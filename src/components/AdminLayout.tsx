import { NavLink, Navigate, Outlet, useNavigate } from "react-router-dom";
import { BedDouble, BookOpenCheck, LayoutDashboard, LogOut, PanelLeft, Users, Wand2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import brandLogo from "../assets/brand-logo.png";

export function AdminLayout() {
  const { admin, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  if (loading) return <div className="page-loader">Loading admin session...</div>;
  if (!admin) return <Navigate to="/admin/login" replace />;

  const navItems = [
    ["Dashboard", "/admin", LayoutDashboard],
    ["Rooms", "/admin/rooms", BedDouble],
    ["Bookings", "/admin/bookings", BookOpenCheck],
    ["Customers", "/admin/customers", Users],
    ["CMS", "/admin/cms", Wand2]
  ] as const;

  return (
    <div className="admin-shell">
      <aside className={open ? "admin-sidebar open" : "admin-sidebar"}>
        <div className="admin-logo">
          <img src={brandLogo} alt="Hotel logo" />
        </div>
        <nav>
          {navItems.map(([label, href, Icon]) => (
            <NavLink key={href} to={href} end={href === "/admin"} onClick={() => setOpen(false)}>
              <Icon size={18} />
              {label}
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
            <strong>{admin.name}</strong>
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
