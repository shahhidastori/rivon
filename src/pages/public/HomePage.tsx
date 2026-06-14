import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BedDouble, CalendarDays, Car, Coffee, MapPin, Sparkles, Star, Waves, Wifi } from "lucide-react";
import type { CmsPayload, Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { Button } from "../../components/ui";

export function HomePage() {
  const [cms, setCms] = useState<CmsPayload | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

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
    <main>
      <section className="hero-section" style={{ backgroundImage: `url(${hero?.imageUrl})` }}>
        <div className="hero-overlay" />
        <div className="hero-content">
          <span>{hero?.subtitle || "Skardu, Pakistan"}</span>
          <h1>{hero?.title || "Peaceful Stays Beside Skardu's Mountains"}</h1>
          <p>{hero?.body}</p>
          <div className="hero-actions">
            <Link to="/booking" className="btn btn-primary">
              <CalendarDays size={16} />
              Book Your Stay
            </Link>
            <Link to="/rooms" className="btn btn-ghost light">
              Explore Rooms
            </Link>
          </div>
        </div>
        <form className="hero-booking-card" onSubmit={(event) => event.preventDefault()}>
          <label>
            Check-in
            <input type="date" defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} />
          </label>
          <label>
            Check-out
            <input type="date" defaultValue={new Date(Date.now() + 345600000).toISOString().slice(0, 10)} />
          </label>
          <label>
            Guests
            <input type="number" min={1} defaultValue={2} />
          </label>
          <Link to="/booking" className="btn btn-primary">
            Search
          </Link>
        </form>
      </section>

      <section className="content-band about-band">
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

      <section className="content-band center-band">
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
            <article className="room-card" key={room.id}>
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
                  <Link to={`/rooms/${room.slug}`} className="btn btn-dark">
                    Details
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="gallery-strip">
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
