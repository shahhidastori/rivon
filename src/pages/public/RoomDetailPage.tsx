import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BedDouble, CheckCircle2, Maximize2, Users } from "lucide-react";
import type { Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { EmptyState, StatusBadge } from "../../components/ui";

export function RoomDetailPage() {
  const { slug = "" } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <main className="page-wrap room-detail-page">
      <section className="detail-header">
        <div>
          <span className="section-kicker">{room.type}</span>
          <h1>{room.name}</h1>
          <p>{room.description}</p>
        </div>
        <StatusBadge value={room.status} />
      </section>

      <section className="room-gallery">
        <img className="gallery-main" src={mainImage?.url} alt={mainImage?.alt || room.name} />
        <div>
          {room.images.slice(1, 3).map((image) => (
            <img key={image.id} src={image.url} alt={image.alt || room.name} />
          ))}
        </div>
      </section>

      <section className="detail-layout">
        <div className="detail-copy">
          <div className="room-facts">
            <span>
              <BedDouble size={18} /> {room.beds} beds
            </span>
            <span>
              <Users size={18} /> {room.capacity} guests
            </span>
            <span>
              <Maximize2 size={18} /> {room.sizeSqm || 36} sqm
            </span>
          </div>
          <h2>Room Amenities</h2>
          <div className="amenity-list">
            {room.amenities.map((amenity) => (
              <span key={amenity.id}>
                <CheckCircle2 size={15} />
                {amenity.name}
              </span>
            ))}
          </div>
          <h2>Availability</h2>
          <p>
            Select your preferred dates in the booking flow. The system checks active bookings before confirmation to
            prevent double-booking.
          </p>
        </div>
        <aside className="booking-summary-card">
          <span>From</span>
          <strong>{currency(room.pricePerNight)}</strong>
          <p>per night, taxes and service fees included in the review step.</p>
          <Link to={`/booking/${room.slug}`} className="btn btn-primary">
            Book This Room
          </Link>
          <Link to="/rooms" className="text-link">
            Back to rooms
          </Link>
        </aside>
      </section>
    </main>
  );
}
