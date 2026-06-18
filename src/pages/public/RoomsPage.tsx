import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  BedDouble,
  CalendarDays,
  Car,
  Coffee,
  Filter,
  MapPin,
  Mountain,
  ShieldCheck,
  Sparkles,
  Users,
  Wifi
} from "lucide-react";
import type { Room } from "../../types";
import { currency, dateLabel, publicApi } from "../../lib/api";
import { Button, EmptyState, Field, SelectField, StatusBadge } from "../../components/ui";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";
import { RoomResultsSkeleton } from "../../components/Skeletons";

const amenityIcons = [Wifi, Coffee, Car, Mountain, Sparkles, ShieldCheck];

function dateSummary(checkIn?: string, checkOut?: string) {
  if (!checkIn && !checkOut) return "Select dates";
  if (checkIn && checkOut) return `${dateLabel(checkIn)} - ${dateLabel(checkOut)}`;
  return checkIn ? `From ${dateLabel(checkIn)}` : `Until ${dateLabel(checkOut || "")}`;
}

export function RoomsPage() {
  const [params, setParams] = useSearchParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const today = useMemo(() => toDateInputValue(new Date()), []);

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
  const [filterDates, setFilterDates] = useState({ checkIn: initial.checkIn, checkOut: initial.checkOut });

  useEffect(() => {
    setFilterDates({ checkIn: initial.checkIn, checkOut: initial.checkOut });
  }, [initial.checkIn, initial.checkOut]);

  const updateFilterCheckIn = (value: string) => {
    setFilterDates((current) => {
      const next = { ...current, checkIn: value };
      if (current.checkOut && fromDateInputValue(current.checkOut) <= fromDateInputValue(value)) {
        next.checkOut = toDateInputValue(addDays(fromDateInputValue(value), 1));
      }
      return next;
    });
  };

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

  const preservedSearch = params.toString();
  const withPreservedSearch = (pathname: string) => ({
    pathname,
    search: preservedSearch ? `?${preservedSearch}` : ""
  });

  return (
    <main className="page-wrap rooms-page">
      <section className="listing-search-strip glass-panel">
        <div>
          <MapPin size={18} />
          <span>Destination</span>
          <strong>Skardu, Pakistan</strong>
        </div>
        <div>
          <CalendarDays size={18} />
          <span>Check-in / out</span>
          <strong>{dateSummary(initial.checkIn, initial.checkOut)}</strong>
        </div>
        <div>
          <Users size={18} />
          <span>Guests</span>
          <strong>{initial.guests || "2"} guests</strong>
        </div>
        <a href="#room-filters" className="btn btn-ghost">
          Modify Search
        </a>
      </section>

      <div className="listing-layout">
        <form className="filter-panel luxury-panel" id="room-filters" key={preservedSearch} onSubmit={submit}>
          <div className="filter-heading">
            <h2>
              <Filter size={18} />
              Filters
            </h2>
            <button type="button" className="text-link reset-link" onClick={() => setParams({})}>
              Reset All
            </button>
          </div>
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
          <div className="filter-date-grid">
            <GlassDatePicker
              label="Check-in"
              name="checkIn"
              value={filterDates.checkIn}
              minDate={today}
              onChange={updateFilterCheckIn}
            />
            <GlassDatePicker
              label="Check-out"
              name="checkOut"
              value={filterDates.checkOut}
              minDate={filterDates.checkIn ? toDateInputValue(addDays(fromDateInputValue(filterDates.checkIn), 1)) : today}
              onChange={(value) => setFilterDates((current) => ({ ...current, checkOut: value }))}
            />
          </div>
          <Button type="submit">Apply Filters</Button>

          <div className="popular-tags" aria-label="Popular room tags">
            <span>Mountain View</span>
            <span>Breakfast</span>
            <span>Family Stay</span>
            <span>Lake Access</span>
          </div>
          <aside className="member-special">
            <span>Member Special</span>
            <strong>Peaceful Skardu escapes</strong>
            <p>Ask about guided lake visits and airport assistance.</p>
          </aside>
        </form>

        <section className="room-results">
          <div className="results-heading">
            <div>
              <h1>Available Rooms in Skardu Valley</h1>
              <p>Showing {rooms.length} stays for your selected preferences</p>
            </div>
            <label>
              Sort by
              <select defaultValue="recommended" aria-label="Sort rooms">
                <option value="recommended">Recommended</option>
                <option value="price-low">Lowest price</option>
                <option value="capacity">Guest capacity</option>
              </select>
            </label>
          </div>
          {loading ? <RoomResultsSkeleton /> : null}
          {error ? <div className="alert error">{error}</div> : null}
          {!loading && rooms.length === 0 ? (
            <EmptyState title="No rooms found" body="Adjust your filters or try a different date range." />
          ) : null}
          {!loading ? (
            <div className="room-result-grid">
              {rooms.map((room) => (
                <article className="room-list-item luxury-room-card" key={room.id}>
                  <div className="room-image-wrap">
                    <img src={room.images[0]?.url} alt={room.images[0]?.alt || room.name} />
                    {room.featured ? <span className="featured-pill">Featured Choice</span> : null}
                  </div>
                  <div className="room-card-body">
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
                        <Users size={15} /> Up to {room.capacity}
                      </span>
                    </div>
                    <div className="amenity-icons" aria-label="Top amenities">
                      {room.amenities.slice(0, 5).map((amenity, amenityIndex) => {
                        const Icon = amenityIcons[amenityIndex % amenityIcons.length];
                        return (
                          <span key={amenity.id} title={amenity.name}>
                            <Icon size={14} />
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <aside>
                    <span>Per night</span>
                    <strong>{currency(room.pricePerNight)}</strong>
                    <div className="room-card-actions">
                      <Link to={withPreservedSearch(`/rooms/${room.slug}`)} className="btn btn-ghost" viewTransition>
                        Details
                      </Link>
                      <Link to={withPreservedSearch(`/booking/${room.slug}`)} className="btn btn-primary">
                        Book
                      </Link>
                    </div>
                  </aside>
                </article>
              ))}
            </div>
          ) : null}

          {!loading && rooms.length ? (
            <section className="listing-benefits glass-panel">
              <article>
                <ShieldCheck size={24} />
                <h3>Best Price Guaranteed</h3>
                <p>Book direct for preferred PKR rates and local guest support.</p>
              </article>
              <article>
                <CalendarDays size={24} />
                <h3>Flexible Cancellation</h3>
                <p>Plans change. Manage eligible reservations online before arrival.</p>
              </article>
              <article>
                <Sparkles size={24} />
                <h3>Exclusive Perks</h3>
                <p>Warm hospitality, scenic guidance, and quiet mountain comforts.</p>
              </article>
            </section>
          ) : null}
        </section>
      </div>
    </main>
  );
}
