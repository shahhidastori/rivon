import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState } from "react";
import brandLogo from "../assets/brand-logo.png";

export function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";

  return (
    <div className={isHome ? "site-shell home-shell" : "site-shell"}>
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </div>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const links = [["Rooms", "/rooms"]];

  return (
    <header className="public-header">
      <nav className="desktop-nav header-primary">
        <Link to="/" className="brand-mark" aria-label="Home">
          <img src={brandLogo} alt="Hotel logo" />
        </Link>
        {links.map(([label, href]) => (
          <NavLink key={href} to={href}>
            {label}
          </NavLink>
        ))}
      </nav>
      <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <nav className={open ? "mobile-menu open" : "mobile-menu"}>
        <NavLink to="/" onClick={() => setOpen(false)}>
          Home
        </NavLink>
        {links.map(([label, href]) => (
          <NavLink key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}

export function PublicFooter() {
  return (
    <footer className="public-footer">
      <div className="footer-brand">
        <img className="footer-logo-image" src={brandLogo} alt="Hotel logo" />
        <p>Peaceful Skardu stays, mountain views, local hospitality, and a seamless booking experience.</p>
      </div>
      <div>
        <h3>Explore</h3>
        <Link to="/rooms">Rooms</Link>
        <Link to="/booking">Book a Stay</Link>
        <Link to="/lookup">Manage Booking</Link>
      </div>
      <div>
        <h3>Policies</h3>
        <Link to="/terms">Terms & Conditions</Link>
        <Link to="/privacy">Privacy Policy</Link>
      </div>
      <div>
        <h3>Contact</h3>
        <p>
          <MapPin size={15} /> Satpara Road, Skardu
        </p>
        <p>
          <Phone size={15} /> +92 5815 555 019
        </p>
        <p>
          <Mail size={15} /> reservations@yourdomain.com
        </p>
      </div>
    </footer>
  );
}
