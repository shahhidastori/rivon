import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  Car,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Heart,
  Maximize2,
  Sparkles,
  Users,
  Wifi,
  X
} from "lucide-react";
import type { Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { EmptyState, StatusBadge } from "../../components/ui";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";
import { RoomDetailSkeleton } from "../../components/Skeletons";

const detailAmenityIcons = [Wifi, Coffee, Car, Sparkles, Heart, CheckCircle2];
const SAVED_ROOMS_KEY = "rivon:saved-room-slugs";

function calculateNights(checkIn: string, checkOut: string) {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / 86400000));
}

export function RoomDetailPage() {
  const { slug = "" } = useParams();
  const [params] = useSearchParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [savedRoomSlugs, setSavedRoomSlugs] = useState<string[]>([]);
  const defaultCheckIn = toDateInputValue(addDays(new Date(), 1));
  const defaultCheckOut = toDateInputValue(addDays(new Date(), 4));
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || defaultCheckOut);
  const [guests, setGuests] = useState(Number(params.get("guests") || 2));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED_ROOMS_KEY) || "[]");
      setSavedRoomSlugs(Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : []);
    } catch {
      setSavedRoomSlugs([]);
    }
  }, []);

  const updateCheckIn = (value: string) => {
    setCheckIn(value);
    if (fromDateInputValue(checkOut) <= fromDateInputValue(value)) {
      setCheckOut(toDateInputValue(addDays(fromDateInputValue(value), 1)));
    }
  };

  useEffect(() => {
    publicApi
      .room(slug)
      .then((payload) => setRoom(payload.room))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowLeft") {
        setLightboxIndex((index) => (index === null ? index : (index - 1 + (room?.images.length || 1)) % (room?.images.length || 1)));
      }
      if (event.key === "ArrowRight") {
        setLightboxIndex((index) => (index === null ? index : (index + 1) % (room?.images.length || 1)));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, room?.images.length]);

  if (loading) return <RoomDetailSkeleton />;
  if (error || !room) return <EmptyState title="Room not found" body={error || "This room is not available."} />;

  const mainImage = room.images[0];
  const activeLightboxImage = lightboxIndex === null ? null : room.images[lightboxIndex];
  const previewNights = calculateNights(checkIn, checkOut);
  const previewTotal = room.pricePerNight * previewNights;
  const isSavedRoom = savedRoomSlugs.includes(room.slug);
  const bookingParams = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(Math.max(1, Math.min(room.capacity, guests || 1)))
  });
  const toggleSavedRoom = () => {
    setSavedRoomSlugs((current) => {
      const next = current.includes(room.slug) ? current.filter((savedSlug) => savedSlug !== room.slug) : [...current, room.slug];
      try {
        localStorage.setItem(SAVED_ROOMS_KEY, JSON.stringify(next));
      } catch {
        // Local storage can be unavailable in restricted browser modes.
      }
      return next;
    });
  };

  return (
    <main className="page-wrap room-detail-page">
      <nav className="breadcrumb-line" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/rooms">Luxury Rooms</Link>
        <span>/</span>
        <strong>{room.type}</strong>
      </nav>

      <section className="room-gallery detail-gallery">
        <div className="gallery-main-wrap">
          {mainImage ? (
            <button type="button" className="gallery-image-button gallery-main-button" onClick={() => setLightboxIndex(0)}>
              <img className="gallery-main" src={mainImage.url} alt={mainImage.alt || room.name} />
            </button>
          ) : null}
          {room.featured ? <span className="featured-pill dark">Featured Selection</span> : null}
        </div>
        <div>
          {room.images.slice(1, 3).map((image, index) => (
            <button type="button" className="gallery-image-button" key={image.id} onClick={() => setLightboxIndex(index + 1)}>
              <img src={image.url} alt={image.alt || room.name} />
            </button>
          ))}
        </div>
      </section>

      {activeLightboxImage
        ? createPortal(
            <div className="image-lightbox" role="dialog" aria-modal="true" aria-label={`${room.name} image gallery`}>
              <button type="button" className="lightbox-close" onClick={() => setLightboxIndex(null)} aria-label="Close image view">
                <X size={22} />
              </button>
              <button
                type="button"
                className="lightbox-nav previous"
                onClick={() => setLightboxIndex((index) => (index === null ? index : (index - 1 + room.images.length) % room.images.length))}
                aria-label="Previous image"
              >
                <ChevronLeft size={28} />
              </button>
              <img src={activeLightboxImage.url} alt={activeLightboxImage.alt || room.name} />
              <button
                type="button"
                className="lightbox-nav next"
                onClick={() => setLightboxIndex((index) => (index === null ? index : (index + 1) % room.images.length))}
                aria-label="Next image"
              >
                <ChevronRight size={28} />
              </button>
              <div className="lightbox-count">
                {(lightboxIndex || 0) + 1} / {room.images.length}
              </div>
            </div>,
            document.body
          )
        : null}

      <section className="detail-layout refined-detail-layout">
        <article className="detail-copy">
          <div className="detail-title-block">
            <h1>{room.name}</h1>
            <button
              type="button"
              className={isSavedRoom ? "save-room-button saved" : "save-room-button"}
              aria-label={isSavedRoom ? "Remove room from favourites" : "Save room to favourites"}
              aria-pressed={isSavedRoom}
              onClick={toggleSavedRoom}
            >
              <Heart size={18} fill={isSavedRoom ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="room-facts">
            <span>
              <Maximize2 size={18} /> {room.sizeSqm || 36} sqm
            </span>
            <span>
              <Users size={18} /> {room.capacity} guests
            </span>
            <span>
              <BedDouble size={18} /> {room.beds} beds
            </span>
          </div>

          <section className="copy-section">
            <h2>The Experience</h2>
            <span>A narrative of luxury and comfort</span>
            <p>{room.description}</p>
          </section>

          <section className="copy-section">
            <h2>Exclusive Amenities</h2>
            <span>Tailored for an effortless stay</span>
            <div className="amenity-tile-grid">
              {room.amenities.map((amenity, index) => {
                const Icon = detailAmenityIcons[index % detailAmenityIcons.length];
                return (
                  <span key={amenity.id}>
                    <Icon size={16} />
                    {amenity.name}
                  </span>
                );
              })}
            </div>
          </section>

          <section className="copy-section policies-block">
            <h2>Policies & Considerations</h2>
            <span>Transparency for a seamless experience</span>
            <details open>
              <summary>Check-in & Check-out</summary>
              <p>
                Check-in starts at 2:00 PM. Early check-in is subject to availability. Check-out time is before 11:00
                AM.
              </p>
            </details>
            <details>
              <summary>Cancellation Policy</summary>
              <p>Eligible reservations can be cancelled online before the cancellation window closes.</p>
            </details>
            <details>
              <summary>House Rules</summary>
              <p>Guests are requested to respect quiet hours and local hospitality customs.</p>
            </details>
          </section>
        </article>

        <aside className="detail-booking-stack">
          <div className="booking-summary-card detail-price-card">
            <div className="price-card-head">
              <div>
                <strong>{currency(room.pricePerNight)}</strong>
                <span>/ night</span>
              </div>
              <StatusBadge value={room.status} />
            </div>
            <div className="inline-availability-card">
              <h3>Real-time Availability</h3>
              <span>Select your preferred dates below</span>
            </div>
            <p>Inclusive of all luxury resort access and local guest care.</p>
            <div className="mini-date-grid">
              <GlassDatePicker label="Check-in Date *" value={checkIn} minDate={defaultCheckIn} onChange={updateCheckIn} />
              <GlassDatePicker
                label="Check-out Date *"
                value={checkOut}
                minDate={toDateInputValue(addDays(fromDateInputValue(checkIn), 1))}
                onChange={setCheckOut}
              />
            </div>
            <label className="field">
              <span>Number of Guests *</span>
              <select value={Math.max(1, Math.min(room.capacity, guests || 1))} onChange={(event) => setGuests(Number(event.target.value))}>
                {Array.from({ length: room.capacity }).map((_, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1} {index === 0 ? "guest" : "guests"}
                  </option>
                ))}
              </select>
            </label>
            <dl className="summary-list compact-summary">
              <div>
                <dt>
                  {currency(room.pricePerNight)} x {previewNights} nights
                </dt>
                <dd>{currency(previewTotal)}</dd>
              </div>
              <div>
                <dt>Booking fees</dt>
                <dd>PKR 0</dd>
              </div>
              <div>
                <dt>Total Amount</dt>
                <dd>{currency(previewTotal)}</dd>
              </div>
            </dl>
            <Link to={`/booking/${room.slug}?${bookingParams.toString()}`} className="btn btn-primary">
              Confirm & Book Now
            </Link>
            <small>You will review final booking details before submitting.</small>
          </div>
        </aside>
      </section>
    </main>
  );
}
