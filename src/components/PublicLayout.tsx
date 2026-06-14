import { Link, NavLink, Outlet } from "react-router-dom";
import { CalendarDays, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState } from "react";
import brandLogo from "../assets/brand-logo.png";

export function PublicLayout() {
  return (
    <div className="site-shell">
      <PublicHeader />
      <Outlet />
      <PublicFooter />
    </div>
  );
}

export function PublicHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    ["Home", "/"],
    ["Rooms", "/rooms"],
    ["Booking Lookup", "/lookup"],
    ["Admin", "/admin"]
  ];

  return (
    <header className="public-header">
      <Link to="/" className="brand-mark" aria-label="Home">
        <img src={brandLogo} alt="Hotel logo" />
      </Link>
      <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Open menu">
        <Menu size={20} />
      </button>
      <nav className={open ? "open" : ""}>
        {links.map(([label, href]) => (
          <NavLink key={href} to={href} onClick={() => setOpen(false)}>
            {label}
          </NavLink>
        ))}
        <Link className="nav-cta" to="/booking" onClick={() => setOpen(false)}>
          <CalendarDays size={16} />
          Book Now
        </Link>
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
