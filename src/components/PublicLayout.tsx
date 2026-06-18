import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useState } from "react";
import { fallbackBrandLogo, useBrandLogo } from "../hooks/useBrandLogo";

const FACEBOOK_URL = "https://www.facebook.com/profile.php?id=61563652525104#";
const INSTAGRAM_URL = "https://www.instagram.com/rivonresort/";

export function PublicLayout() {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const logoUrl = useBrandLogo();

  return (
    <div className={isHome ? "site-shell home-shell" : "site-shell"}>
      <PublicHeader logoUrl={logoUrl} />
      <Outlet />
      <PublicFooter logoUrl={logoUrl} />
    </div>
  );
}

type BrandLogoProps = {
  logoUrl?: string;
};

export function PublicHeader({ logoUrl = fallbackBrandLogo }: BrandLogoProps) {
  const [open, setOpen] = useState(false);
  const links = [
    ["Our Story", "/#about"],
    ["Our Amenities", "/#facilities"],
    ["Gallery", "/#gallery"]
  ];

  return (
    <header className="public-header">
      <nav className="desktop-nav header-primary">
        <Link to="/" className="brand-mark" aria-label="Home">
          <img src={logoUrl} alt="Hotel logo" />
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

export function PublicFooter({ logoUrl = fallbackBrandLogo }: BrandLogoProps) {
  return (
    <footer className="public-footer">
      <div className="footer-brand">
        <img className="footer-logo-image" src={logoUrl} alt="Hotel logo" />
        <p>Peaceful Skardu stays, mountain views, local hospitality, and a seamless booking experience.</p>
        <div className="footer-socials" aria-label="Social media links">
          <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" aria-label="Visit Rivon Resort on Facebook">
            <Facebook size={18} />
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noreferrer" aria-label="Visit Rivon Resort on Instagram">
            <Instagram size={18} />
          </a>
        </div>
      </div>
      <div>
        <h3>Explore</h3>
        <Link to="/rooms">Rooms</Link>
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
          <Phone size={15} /> +92 340 8413273
        </p>
        <p>
          <Mail size={15} /> reservations@rivon.com
        </p>
      </div>
    </footer>
  );
}
