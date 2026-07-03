import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import {
  BedDouble,
  Car,
  ChevronLeft,
  ChevronRight,
  Coffee,
  MapPin,
  Minus,
  Plus,
  Sparkles,
  Users,
  Waves,
  Wifi,
  X
} from "lucide-react";
import type { CmsPayload, Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";
import { fallbackBrandLogo, useBrandLogo, versionedBrandLogoUrl } from "../../hooks/useBrandLogo";
import { HomePageSkeleton } from "../../components/Skeletons";
import { RichTextContent } from "../../components/RichTextContent";

const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/cvEybjxAVFQKJ22V9";

export function HomePage() {
  const navigate = useNavigate();
  const defaultCheckIn = useMemo(() => toDateInputValue(addDays(new Date(), 1)), []);
  const defaultCheckOut = useMemo(() => toDateInputValue(addDays(new Date(), 4)), []);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(2);
  const [cms, setCms] = useState<CmsPayload | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [hasBookableRooms, setHasBookableRooms] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guestOpen, setGuestOpen] = useState(false);
  const [activeHeroImage, setActiveHeroImage] = useState(0);
  const [galleryStartIndex, setGalleryStartIndex] = useState(0);
  const [galleryLightboxIndex, setGalleryLightboxIndex] = useState<number | null>(null);
  const guestPickerRef = useRef<HTMLDivElement>(null);

  const updateCheckIn = (value: string) => {
    setCheckIn(value);
    if (fromDateInputValue(checkOut) <= fromDateInputValue(value)) {
      setCheckOut(toDateInputValue(addDays(fromDateInputValue(value), 1)));
    }
  };

  const searchRooms = () => {
    const params = new URLSearchParams({
      checkIn,
      checkOut,
      guests: String(Math.max(1, guests))
    });
    setGuestOpen(false);
    navigate(`/rooms?${params.toString()}`, { viewTransition: true });
  };

  useEffect(() => {
    Promise.all([publicApi.cms(), publicApi.rooms("?featured=true"), publicApi.rooms()])
      .then(([cmsPayload, roomsPayload, allRoomsPayload]) => {
        setCms(cmsPayload);
        setRooms(roomsPayload.rooms);
        setHasBookableRooms(allRoomsPayload.rooms.some((room) => room.status === "AVAILABLE"));
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!guestOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!guestPickerRef.current?.contains(event.target as Node)) {
        setGuestOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [guestOpen]);

  const hero = cms?.sections.hero;
  const cmsBrandLogoUrl = versionedBrandLogoUrl(cms?.sections.branding?.imageUrl, cms?.sections.branding?.updatedAt, fallbackBrandLogo);
  const brandLogoUrl = useBrandLogo(cmsBrandLogoUrl);
  const facilities = useMemo(() => {
    const metadata = cms?.sections.facilities?.metadata;
    return Array.isArray(metadata) ? metadata : [];
  }, [cms]);
  const gallery = useMemo(() => {
    const metadata = cms?.sections.gallery?.metadata;
    return Array.isArray(metadata) ? metadata : [];
  }, [cms]);
  const galleryImages = useMemo(() => Array.from(new Set(gallery.map((item) => String(item)).filter(Boolean))), [gallery]);
  const heroImages = useMemo(() => {
    const roomImages = rooms.flatMap((room) => room.images.map((image) => image.url));
    const sources = [hero?.imageUrl, ...galleryImages, ...roomImages].filter(
      (source): source is string => Boolean(source)
    );
    return Array.from(new Set(sources)).slice(0, 6);
  }, [galleryImages, hero?.imageUrl, rooms]);
  const guestLabel = `${guests} ${guests === 1 ? "Guest" : "Guests"}`;
  const activeGalleryLightboxImage = galleryLightboxIndex === null ? null : galleryImages[galleryLightboxIndex];
  const visibleGalleryImages = useMemo(() => {
    if (galleryImages.length === 0) return [];
    return Array.from({ length: Math.min(5, galleryImages.length) }, (_, offset) => {
      const index = (galleryStartIndex + offset) % galleryImages.length;
      return {
        index,
        src: galleryImages[index]
      };
    });
  }, [galleryImages, galleryStartIndex]);

  const shiftHeroImage = (direction: number) => {
    if (heroImages.length <= 1) return;
    setActiveHeroImage((index) => (index + direction + heroImages.length) % heroImages.length);
  };

  const shiftGallery = (direction: number) => {
    if (galleryImages.length <= 5) return;
    setGalleryStartIndex((index) => (index + direction + galleryImages.length) % galleryImages.length);
  };

  useEffect(() => {
    setActiveHeroImage(0);
    if (heroImages.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setActiveHeroImage((index) => (index + 1) % heroImages.length);
    }, 4000);

    return () => window.clearInterval(interval);
  }, [heroImages.length]);

  useEffect(() => {
    setGalleryStartIndex(0);
  }, [galleryImages.length]);

  useEffect(() => {
    if (galleryLightboxIndex === null || galleryImages.length === 0) return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setGalleryLightboxIndex(null);
      }
      if (event.key === "ArrowLeft") {
        setGalleryLightboxIndex((index) => (index === null ? index : (index - 1 + galleryImages.length) % galleryImages.length));
      }
      if (event.key === "ArrowRight") {
        setGalleryLightboxIndex((index) => (index === null ? index : (index + 1) % galleryImages.length));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [galleryImages.length, galleryLightboxIndex]);

  if (loading) return <HomePageSkeleton />;

  return (
    <main className="minimal-home-page">
      <section className="minimal-hero">
        <div className="minimal-hero-slideshow" aria-hidden="true">
          {heroImages.map((image, index) => (
            <div
              className={index === activeHeroImage ? "minimal-hero-slide active" : "minimal-hero-slide"}
              key={image}
              style={{ backgroundImage: `url(${image})` }}
            />
          ))}
        </div>
        {heroImages.length > 1 ? (
          <>
            <button type="button" className="carousel-arrow hero-arrow previous" onClick={() => shiftHeroImage(-1)} aria-label="Previous hero image">
              <ChevronLeft size={26} />
            </button>
            <button type="button" className="carousel-arrow hero-arrow next" onClick={() => shiftHeroImage(1)} aria-label="Next hero image">
              <ChevronRight size={26} />
            </button>
          </>
        ) : null}
        <header className="minimal-hero-header" aria-label="Landing page navigation">
          <Link to="/" className="minimal-hero-logo" aria-label="Home">
            <img src={brandLogoUrl} alt="Hotel logo" />
          </Link>
          <nav>
            <a href="#about">Our Story</a>
            <a href="#facilities">Our Amenities</a>
            <a href="#gallery">Gallery</a>
            {hasBookableRooms ? <Link to="/rooms">Book Rooms</Link> : null}
          </nav>
        </header>

        <div className="minimal-hero-frame">
          <div className="minimal-hero-content">
            <span>{hero?.subtitle || "Skardu, Pakistan"}</span>
            <h1>
              Find Your Perfect
              <br />
              <mark>Skardu Stay</mark>
            </h1>
            <RichTextContent
              className="minimal-hero-copy"
              value={hero?.body}
              fallback="A peaceful mountain retreat shaped around lake days, valley drives, and warm local hospitality."
            />
          </div>

          <form
            className="minimal-booking-bar"
            onSubmit={(event) => {
              event.preventDefault();
              searchRooms();
            }}
          >
            <GlassDatePicker label="Check-in" value={checkIn} minDate={defaultCheckIn} onChange={updateCheckIn} variant="hero" />
            <GlassDatePicker
              label="Check-out"
              value={checkOut}
              minDate={toDateInputValue(addDays(fromDateInputValue(checkIn), 1))}
              onChange={setCheckOut}
              variant="hero"
            />
            <div className={guestOpen ? "minimal-guest-field open" : "minimal-guest-field"} ref={guestPickerRef}>
              <button
                type="button"
                className="minimal-guest-trigger"
                aria-expanded={guestOpen}
                aria-haspopup="dialog"
                onClick={() => setGuestOpen((current) => !current)}
              >
                <Users size={20} />
                <span>
                  <small>Guests</small>
                  <strong>{guestLabel}</strong>
                </span>
              </button>
              {guestOpen ? (
                <div className="minimal-guests-popover" role="dialog" aria-label="Select guests">
                  <div>
                    <span>
                      <strong>Guests</strong>
                      <small>Ages 13 or above</small>
                    </span>
                    <div className="guest-stepper">
                      <button type="button" aria-label="Decrease guests" onClick={() => setGuests((value) => Math.max(1, value - 1))}>
                        <Minus size={16} />
                      </button>
                      <strong>{guestLabel}</strong>
                      <button type="button" aria-label="Increase guests" onClick={() => setGuests((value) => value + 1)}>
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <button type="button" className="guest-done-button" onClick={() => setGuestOpen(false)}>
                    Done
                  </button>
                </div>
              ) : null}
            </div>
            <button type="submit" className="btn btn-primary">
              Book Your Stay
            </button>
          </form>
        </div>
      </section>

      <section className="content-band about-band minimal-about-band" id="about">
        <div>
          <span className="section-kicker">{cms?.sections.about?.subtitle}</span>
          <h2>{cms?.sections.about?.title}</h2>
          <RichTextContent value={cms?.sections.about?.body} />
          <div className="about-stats">
            <strong>42</strong>
            <span>Rooms & Suites</span>
          </div>
        </div>
        <img src={cms?.sections.about?.imageUrl || ""} alt="Hotel near Skardu mountains" />
      </section>

      <section className="content-band center-band" id="facilities">
        <span className="section-kicker">Services</span>
        <h2>World-Class Facilities</h2>
        <div className="facility-grid">
          {facilities.map((item: any, index) => {
            const icons = [Coffee, Sparkles, Waves, Car];
            const Icon = icons[index % icons.length];
            return (
              <article className="facility-card" key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <RichTextContent value={item.body} />
              </article>
            );
          })}
        </div>
      </section>

      {rooms.length > 0 ? (
        <section className="content-band">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Rooms</span>
              <h2>Featured Rooms</h2>
            </div>
            <Link to="/rooms" className="text-link">
              View all rooms
            </Link>
          </div>
          <div className="room-card-grid">
            {rooms.slice(0, 3).map((room) => (
              <article
                className="room-card clickable-room-card"
                key={room.id}
                onClick={() => navigate(`/rooms/${room.slug}`, { viewTransition: true })}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/rooms/${room.slug}`, { viewTransition: true });
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={`View details for ${room.name}`}
              >
                <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
                <div>
                  <span>{room.type}</span>
                  <h3>{room.name}</h3>
                  <p>{room.description}</p>
                  <div className="room-meta">
                    <span>
                      <BedDouble size={15} /> {room.beds} beds
                    </span>
                    <span>
                      <Wifi size={15} /> {room.capacity} guests
                    </span>
                  </div>
                  <div className="room-card-footer">
                    <strong>{currency(room.pricePerNight)} / night</strong>
                    <Link
                      to={`/rooms/${room.slug}`}
                      className="btn btn-dark"
                      viewTransition
                      onClick={(event) => event.stopPropagation()}
                    >
                      Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="gallery-strip gallery-slider" id="gallery" aria-label="Skardu image gallery">
        {galleryImages.length > 5 ? (
          <button type="button" className="carousel-arrow gallery-arrow previous" onClick={() => shiftGallery(-1)} aria-label="Previous gallery images">
            <ChevronLeft size={24} />
          </button>
        ) : null}
        {visibleGalleryImages.map(({ src, index }) => (
          <button
            type="button"
            className="gallery-image-button"
            key={`${src}-${index}`}
            onClick={() => setGalleryLightboxIndex(index)}
            aria-label={`Open Skardu gallery image ${index + 1}`}
          >
            <img src={src} alt={`Skardu gallery ${index + 1}`} />
          </button>
        ))}
        {galleryImages.length > 5 ? (
          <button type="button" className="carousel-arrow gallery-arrow next" onClick={() => shiftGallery(1)} aria-label="Next gallery images">
            <ChevronRight size={24} />
          </button>
        ) : null}
      </section>

      <section className="content-band location-band compact-location-band">
        <div>
          <span className="section-kicker">Location</span>
          <h2>{cms?.sections.contact?.title}</h2>
          <RichTextContent value={cms?.sections.contact?.body} />
          <p className="contact-line">
            <MapPin size={18} />
            Satpara Road, Skardu, Gilgit-Baltistan, Pakistan
          </p>
        </div>
        <a className="map-card" href={GOOGLE_MAPS_URL} target="_blank" rel="noreferrer" aria-label="Open Rivon Resort location in Google Maps">
          <iframe
            className="map-card-frame"
            src="https://www.google.com/maps?q=Rivon%20Resort%20Skardu%20Pakistan&output=embed"
            title="Rivon Resort location preview"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <span className="map-pin-marker">
            <MapPin size={24} />
          </span>
          <strong>Rivon Resort</strong>
          <small>International Airport Road, Skardu</small>
        </a>
      </section>
      {activeGalleryLightboxImage
        ? createPortal(
            <div className="image-lightbox" role="dialog" aria-modal="true" aria-label="Skardu image gallery">
              <button type="button" className="lightbox-close" onClick={() => setGalleryLightboxIndex(null)} aria-label="Close image view">
                <X size={22} />
              </button>
              <button
                type="button"
                className="lightbox-nav previous"
                onClick={() =>
                  setGalleryLightboxIndex((index) => (index === null ? index : (index - 1 + galleryImages.length) % galleryImages.length))
                }
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <img src={activeGalleryLightboxImage} alt={`Skardu gallery ${(galleryLightboxIndex || 0) + 1}`} />
              <button
                type="button"
                className="lightbox-nav next"
                onClick={() => setGalleryLightboxIndex((index) => (index === null ? index : (index + 1) % galleryImages.length))}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
              <div className="lightbox-count">
                {(galleryLightboxIndex || 0) + 1} / {galleryImages.length}
              </div>
            </div>,
            document.body
          )
        : null}
    </main>
  );
}
