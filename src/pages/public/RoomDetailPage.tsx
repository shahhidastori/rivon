import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  Car,
  CheckCircle2,
  Coffee,
  Heart,
  Maximize2,
  Sparkles,
  Star,
  Users,
  Wifi
} from "lucide-react";
import type { Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { EmptyState, StatusBadge } from "../../components/ui";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";

const detailAmenityIcons = [Wifi, Coffee, Car, Sparkles, Heart, CheckCircle2];

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
  const defaultCheckIn = toDateInputValue(addDays(new Date(), 1));
  const defaultCheckOut = toDateInputValue(addDays(new Date(), 4));
  const [checkIn, setCheckIn] = useState(params.get("checkIn") || defaultCheckIn);
  const [checkOut, setCheckOut] = useState(params.get("checkOut") || defaultCheckOut);
  const [guests, setGuests] = useState(Number(params.get("guests") || 2));

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

  if (loading) return <div className="page-loader">Loading room details...</div>;
  if (error || !room) return <EmptyState title="Room not found" body={error || "This room is not available."} />;

  const mainImage = room.images[0];
  const previewNights = calculateNights(checkIn, checkOut);
  const previewTotal = room.pricePerNight * previewNights;
  const bookingParams = new URLSearchParams({
    checkIn,
    checkOut,
    guests: String(Math.max(1, Math.min(room.capacity, guests || 1)))
  });

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
          {mainImage ? <img className="gallery-main" src={mainImage.url} alt={mainImage.alt || room.name} /> : null}
          {room.featured ? <span className="featured-pill dark">Featured Selection</span> : null}
        </div>
        <div>
          {room.images.slice(1, 3).map((image) => (
            <img key={image.id} src={image.url} alt={image.alt || room.name} />
          ))}
        </div>
      </section>

      <section className="detail-layout refined-detail-layout">
        <article className="detail-copy">
          <div className="detail-title-block">
            <div className="rating-line" aria-label="Guest rating">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star key={index} size={14} fill="currentColor" />
              ))}
              <span>4.9 (128 reviews)</span>
            </div>
            <h1>{room.name}</h1>
            <button type="button" className="save-room-button" aria-label="Save room">
              <Heart size={18} />
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
              <GlassDatePicker label="Check-in" value={checkIn} minDate={defaultCheckIn} onChange={updateCheckIn} />
              <GlassDatePicker
                label="Check-out"
                value={checkOut}
                minDate={toDateInputValue(addDays(fromDateInputValue(checkIn), 1))}
                onChange={setCheckOut}
              />
            </div>
            <label className="field">
              <span>Guests</span>
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
