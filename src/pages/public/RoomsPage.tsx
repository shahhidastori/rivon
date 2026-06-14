import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BedDouble, Filter, Users } from "lucide-react";
import type { Room } from "../../types";
import { currency, publicApi } from "../../lib/api";
import { Button, EmptyState, Field, SelectField, StatusBadge } from "../../components/ui";

export function RoomsPage() {
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    publicApi
      .rooms(`?${params.toString()}`)
      .then((payload) => {
        setRooms(payload.rooms);
        setTypes(payload.filters.types);
        setError("");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params]);

  const initial = useMemo(
    () => ({
      type: params.get("type") || "all",
      guests: params.get("guests") || "",
      minPrice: params.get("minPrice") || "",
      maxPrice: params.get("maxPrice") || "",
      checkIn: params.get("checkIn") || "",
      checkOut: params.get("checkOut") || ""
    }),
    [params]
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      const text = String(value);
      if (text && text !== "all") next.set(key, text);
    }
    setParams(next);
  }

  return (
    <main className="page-wrap rooms-page">
      <section className="page-hero compact">
        <span className="section-kicker">Rooms & Suites</span>
        <h1>Choose the stay that fits your trip</h1>
      </section>

      <div className="listing-layout">
        <form className="filter-panel" onSubmit={submit}>
          <h2>
            <Filter size={18} />
            Filters
          </h2>
          <SelectField label="Room type" name="type" defaultValue={initial.type}>
            <option value="all">All types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </SelectField>
          <Field label="Guests" name="guests" type="number" min={1} defaultValue={initial.guests} />
          <Field label="Min price" name="minPrice" type="number" min={0} defaultValue={initial.minPrice} />
          <Field label="Max price" name="maxPrice" type="number" min={0} defaultValue={initial.maxPrice} />
          <Field label="Check-in" name="checkIn" type="date" defaultValue={initial.checkIn} />
          <Field label="Check-out" name="checkOut" type="date" defaultValue={initial.checkOut} />
          <Button type="submit">Apply Filters</Button>
          <button type="button" className="text-link reset-link" onClick={() => setParams({})}>
            Clear filters
          </button>
        </form>

        <section className="room-results">
          {loading ? <div className="page-loader">Loading rooms...</div> : null}
          {error ? <div className="alert error">{error}</div> : null}
          {!loading && rooms.length === 0 ? (
            <EmptyState title="No rooms found" body="Adjust your filters or try a different date range." />
          ) : null}
          {rooms.map((room) => (
            <article className="room-list-item" key={room.id}>
              <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
              <div>
                <div className="room-list-title">
                  <div>
                    <span>{room.type}</span>
                    <h2>{room.name}</h2>
                  </div>
                  <StatusBadge value={room.status} />
                </div>
                <p>{room.description}</p>
                <div className="room-meta">
                  <span>
                    <BedDouble size={15} /> {room.beds} beds
                  </span>
                  <span>
                    <Users size={15} /> Up to {room.capacity} guests
                  </span>
                </div>
                <div className="amenity-list compact">
                  {room.amenities.slice(0, 5).map((amenity) => (
                    <span key={amenity.id}>{amenity.name}</span>
                  ))}
                </div>
              </div>
              <aside>
                <strong>{currency(room.pricePerNight)}</strong>
                <span>per night</span>
                <Link to={`/rooms/${room.slug}`} className="btn btn-dark">
                  View Details
                </Link>
                <Link to={`/booking/${room.slug}`} className="btn btn-primary">
                  Book
                </Link>
              </aside>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
