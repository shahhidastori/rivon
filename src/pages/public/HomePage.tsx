import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BedDouble, Car, Coffee, MapPin, Sparkles, Star, Users, Waves, Wifi } from "lucide-react";
import type { CmsPayload, Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";

export function HomePage() {
  const navigate = useNavigate();
  const defaultCheckIn = useMemo(() => toDateInputValue(addDays(new Date(), 1)), []);
  const defaultCheckOut = useMemo(() => toDateInputValue(addDays(new Date(), 4)), []);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState(2);
  const [cms, setCms] = useState<CmsPayload | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
    navigate(`/rooms?${params.toString()}`, { viewTransition: true });
  };

  useEffect(() => {
    Promise.all([publicApi.cms(), publicApi.rooms("?featured=true")])
      .then(([cmsPayload, roomsPayload]) => {
        setCms(cmsPayload);
        setRooms(roomsPayload.rooms);
      })
      .finally(() => setLoading(false));
  }, []);

  const hero = cms?.sections.hero;
  const facilities = useMemo(() => {
    const metadata = cms?.sections.facilities?.metadata;
    return Array.isArray(metadata) ? metadata : [];
  }, [cms]);
  const testimonials = useMemo(() => {
    const metadata = cms?.sections.testimonials?.metadata;
    return Array.isArray(metadata) ? metadata : [];
  }, [cms]);
  const gallery = useMemo(() => {
    const metadata = cms?.sections.gallery?.metadata;
    return Array.isArray(metadata) ? metadata : [];
  }, [cms]);

  if (loading) return <div className="page-loader">Preparing your stay...</div>;

  return (
    <main className="minimal-home-page">
      <section className="minimal-hero" style={{ backgroundImage: `url(${hero?.imageUrl})` }}>
        <div className="minimal-hero-frame">
          <div className="minimal-hero-content">
            <span>{hero?.subtitle || "Skardu, Pakistan"}</span>
            <h1>
              Find Your Perfect <mark>Skardu Stay</mark>
            </h1>
            <p>{hero?.body || "A peaceful mountain retreat shaped around lake days, valley drives, and warm local hospitality."}</p>
          </div>

          <div className="hero-rating-badge">
            <Star size={22} fill="currentColor" />
            <strong>4.9</strong>
            <span>guest rating</span>
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
            <label>
              <Users size={20} />
              <span>
                Guests
                <input type="number" min={1} value={guests} onChange={(event) => setGuests(Number(event.target.value) || 1)} />
              </span>
            </label>
            <button type="submit" className="btn btn-primary">
              Book Your Stay
            </button>
          </form>
        </div>
      </section>

      <section className="content-band about-band minimal-about-band">
        <div>
          <span className="section-kicker">{cms?.sections.about?.subtitle}</span>
          <h2>{cms?.sections.about?.title}</h2>
          <p>{cms?.sections.about?.body}</p>
          <div className="about-stats">
            <strong>42</strong>
            <span>Rooms & Suites</span>
            <strong>4.9</strong>
            <span>Guest Rating</span>
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
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

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

      <section className="gallery-strip" id="gallery">
        {gallery.slice(0, 5).map((src: any, index) => (
          <img key={String(src)} src={String(src)} alt={`Skardu gallery ${index + 1}`} />
        ))}
      </section>

      <section className="content-band center-band">
        <span className="section-kicker">Reviews</span>
        <h2>What Guests Say</h2>
        <div className="testimonial-grid">
          {testimonials.map((item: any) => (
            <article className="testimonial-card" key={item.name}>
              <div>
                {Array.from({ length: Number(item.rating || 5) }).map((_, index) => (
                  <Star key={index} size={15} fill="currentColor" />
                ))}
              </div>
              <p>{item.quote}</p>
              <strong>{item.name}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band location-band">
        <div>
          <span className="section-kicker">Location</span>
          <h2>{cms?.sections.contact?.title}</h2>
          <p>{cms?.sections.contact?.body}</p>
          <p className="contact-line">
            <MapPin size={18} />
            Satpara Road, Skardu, Gilgit-Baltistan, Pakistan
          </p>
        </div>
        <div className="map-card">Map Preview</div>
      </section>
    </main>
  );
}
