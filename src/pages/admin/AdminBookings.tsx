import { FormEvent, useEffect, useMemo, useState } from "react";
import { BedDouble, CalendarPlus, Grid3X3, List, Plus, X } from "lucide-react";
import type { Booking, BookingStatus, PaymentMethod, PaymentStatus, Room, RoomStatus } from "../../types";
import { adminApi, currency, dateLabel } from "../../lib/api";
import { Button, Field, SelectField, StatusBadge } from "../../components/ui";

const bookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];
const paymentStatuses: PaymentStatus[] = ["UNPAID", "PAID", "PARTIALLY_PAID", "REFUNDED"];
const paymentMethods: PaymentMethod[] = ["CASH", "CARD", "BANK_TRANSFER"];
const roomStatuses: RoomStatus[] = ["AVAILABLE", "OCCUPIED", "UNAVAILABLE", "MAINTENANCE"];
const activeBookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN"];

type ViewMode = "list" | "grid";

const emptyBookingForm = {
  roomId: "",
  checkIn: "",
  checkOut: "",
  guests: 2,
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  country: "",
  paymentMethod: "CASH" as PaymentMethod,
  status: "PENDING" as BookingStatus,
  paymentStatus: "UNPAID" as PaymentStatus
};

function roomStatusLabel(status: RoomStatus) {
  return status.replace("_", " ");
}

function getActiveBooking(room: Room, bookings: Booking[]) {
  return bookings.find((booking) => booking.room.id === room.id && activeBookingStatuses.includes(booking.status));
}

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingForm, setBookingForm] = useState(emptyBookingForm);

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    adminApi.bookings(params.toString() ? `?${params}` : "").then((payload) => setBookings(payload.bookings));
    adminApi.rooms().then((payload) => {
      setRooms(payload.rooms);
      setBookingForm((current) => ({ ...current, roomId: current.roomId || payload.rooms[0]?.id || "" }));
    });
  }

  useEffect(load, []);

  const selectedBooking = useMemo(
    () => (selectedRoom ? getActiveBooking(selectedRoom, bookings) : undefined),
    [bookings, selectedRoom]
  );

  function openRoom(room: Room) {
    setSelectedRoom(room);
    setBookingForm({
      ...emptyBookingForm,
      roomId: room.id,
      guests: Math.min(Math.max(1, emptyBookingForm.guests), room.capacity)
    });
  }

  async function updateBooking(id: string, key: "status" | "paymentStatus", value: BookingStatus | PaymentStatus) {
    try {
      const payload = await adminApi.updateBooking(id, { [key]: value });
      setBookings((current) => current.map((booking) => (booking.id === id ? payload.booking : booking)));
      setMessage("Booking updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function updateRoomStatus(room: Room, nextStatus: RoomStatus) {
    try {
      const payload = await adminApi.saveRoom({
        id: room.id,
        name: room.name,
        type: room.type,
        description: room.description,
        pricePerNight: room.pricePerNight,
        beds: room.beds,
        capacity: room.capacity,
        sizeSqm: room.sizeSqm,
        status: nextStatus,
        featured: room.featured,
        hideFromWebsite: room.hideFromWebsite,
        amenities: room.amenities.map((amenity) => amenity.name),
        images: room.images.map((image) => ({
          id: image.id,
          url: image.url,
          alt: image.alt || room.name,
          isPrimary: image.isPrimary,
          sortOrder: image.sortOrder
        }))
      });
      setRooms((current) => current.map((item) => (item.id === room.id ? payload.room : item)));
      setSelectedRoom(payload.room);
      setMessage("Room status updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Room status update failed.");
    }
  }

  async function createBooking(event: FormEvent) {
    event.preventDefault();
    try {
      await adminApi.createBooking({
        roomId: bookingForm.roomId,
        checkIn: bookingForm.checkIn,
        checkOut: bookingForm.checkOut,
        guests: Number(bookingForm.guests),
        customer: {
          firstName: bookingForm.firstName,
          lastName: bookingForm.lastName,
          email: bookingForm.email,
          phone: bookingForm.phone,
          country: bookingForm.country
        },
        paymentMethod: bookingForm.paymentMethod,
        status: bookingForm.status,
        paymentStatus: bookingForm.paymentStatus
      });
      setMessage("Manual booking created.");
      setShowCreate(false);
      setSelectedRoom(null);
      setBookingForm(emptyBookingForm);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Booking creation failed.");
    }
  }

  const isErrorMessage = message.includes("failed") || message.includes("not");
  const modalCanCreateBooking = selectedRoom?.status === "AVAILABLE";

  return (
    <section className="admin-page">
      <div className="admin-heading inline">
        <div>
          <span>Operations</span>
          <h1>Booking Management</h1>
        </div>
        <div className="admin-heading-actions">
          <div className="segmented-control" aria-label="Booking view mode">
            <button type="button" className={viewMode === "list" ? "active" : ""} onClick={() => setViewMode("list")}>
              <List size={15} />
              List View
            </button>
            <button type="button" className={viewMode === "grid" ? "active" : ""} onClick={() => setViewMode("grid")}>
              <Grid3X3 size={15} />
              Grid View
            </button>
          </div>
          <Button
            type="button"
            onClick={() => {
              setShowCreate((value) => !value);
              setViewMode("grid");
              setSelectedRoom(null);
            }}
          >
            <Plus size={16} />
            Manual Booking
          </Button>
        </div>
      </div>

      {message ? <div className={isErrorMessage ? "alert error" : "alert success"}>{message}</div> : null}

      <form
        className="admin-filter-row"
        onSubmit={(event) => {
          event.preventDefault();
          load();
        }}
      >
        <input placeholder="Search customer, room, reference" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">All statuses</option>
          {bookingStatuses.map((item) => (
            <option key={item} value={item}>
              {item.replace("_", " ")}
            </option>
          ))}
        </select>
        <Button variant="dark">Filter</Button>
      </form>

      {showCreate ? (
        <section className="admin-card manual-booking-panel">
          <div className="section-heading-row">
            <div>
              <span className="admin-eyebrow">Front Desk</span>
              <h2>Manual Booking Grid</h2>
            </div>
            <p>Choose a blue available room to open the booking dialog.</p>
          </div>
          <RoomOccupancyGrid rooms={rooms} bookings={bookings} onRoomClick={openRoom} />
        </section>
      ) : null}

      {viewMode === "grid" && !showCreate ? (
        <section className="admin-card">
          <div className="section-heading-row">
            <div>
              <span className="admin-eyebrow">Occupancy</span>
              <h2>Room Occupancy Grid</h2>
            </div>
            <div className="occupancy-legend" aria-label="Room status color legend">
              {roomStatuses.map((item) => (
                <span key={item}>
                  <i className={`legend-dot room-status-${item.toLowerCase().replace("_", "-")}`} />
                  {roomStatusLabel(item)}
                </span>
              ))}
            </div>
          </div>
          <RoomOccupancyGrid rooms={rooms} bookings={bookings} onRoomClick={openRoom} />
        </section>
      ) : null}

      {viewMode === "list" ? (
        <div className="admin-card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Room</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.reference}</td>
                  <td>
                    {booking.customer.firstName} {booking.customer.lastName}
                    <small>{booking.customer.email}</small>
                  </td>
                  <td>{booking.room.name}</td>
                  <td>
                    {dateLabel(booking.checkIn)}
                    <small>{dateLabel(booking.checkOut)}</small>
                  </td>
                  <td>
                    <select value={booking.status} onChange={(event) => updateBooking(booking.id, "status", event.target.value as BookingStatus)}>
                      {bookingStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={booking.paymentStatus}
                      onChange={(event) => updateBooking(booking.id, "paymentStatus", event.target.value as PaymentStatus)}
                    >
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{currency(booking.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {selectedRoom ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelectedRoom(null)}>
          <section className="admin-modal room-action-modal" role="dialog" aria-modal="true" aria-label={`${selectedRoom.name} actions`} onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="modal-close-button" onClick={() => setSelectedRoom(null)} aria-label="Close room actions">
              <X size={18} />
            </button>
            <div className="modal-room-summary">
              <div>
                <span className="admin-eyebrow">Room details</span>
                <h2>{selectedRoom.name}</h2>
                <p>{selectedRoom.type} · {selectedRoom.capacity} guests · {currency(selectedRoom.pricePerNight)} / night</p>
              </div>
              <StatusBadge value={selectedRoom.status} />
            </div>

            <div className="modal-action-grid">
              <SelectField label="Update room status" value={selectedRoom.status} onChange={(event) => updateRoomStatus(selectedRoom, event.target.value as RoomStatus)}>
                {roomStatuses.map((item) => (
                  <option key={item} value={item}>
                    {roomStatusLabel(item)}
                  </option>
                ))}
              </SelectField>

              {selectedBooking ? (
                <section className="booking-detail-mini">
                  <h3>Current booking</h3>
                  <p>
                    <strong>{selectedBooking.reference}</strong>
                    <span>
                      {selectedBooking.customer.firstName} {selectedBooking.customer.lastName}
                    </span>
                    <small>{dateLabel(selectedBooking.checkIn)} - {dateLabel(selectedBooking.checkOut)}</small>
                  </p>
                  <div className="form-grid tight">
                    <SelectField
                      label="Booking status"
                      value={selectedBooking.status}
                      onChange={(event) => updateBooking(selectedBooking.id, "status", event.target.value as BookingStatus)}
                    >
                      {bookingStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField
                      label="Payment"
                      value={selectedBooking.paymentStatus}
                      onChange={(event) => updateBooking(selectedBooking.id, "paymentStatus", event.target.value as PaymentStatus)}
                    >
                      {paymentStatuses.map((item) => (
                        <option key={item} value={item}>
                          {item.replace("_", " ")}
                        </option>
                      ))}
                    </SelectField>
                  </div>
                </section>
              ) : null}
            </div>

            {showCreate && !modalCanCreateBooking ? (
              <div className="alert error">Manual booking can start only from a blue available room.</div>
            ) : null}

            {modalCanCreateBooking ? (
              <form className="admin-form modal-booking-form" onSubmit={createBooking}>
                <h3>
                  <CalendarPlus size={17} />
                  Create booking
                </h3>
                <div className="form-grid">
                  <Field label="Check-in" type="date" value={bookingForm.checkIn} onChange={(event) => setBookingForm({ ...bookingForm, checkIn: event.target.value })} />
                  <Field label="Check-out" type="date" value={bookingForm.checkOut} onChange={(event) => setBookingForm({ ...bookingForm, checkOut: event.target.value })} />
                  <Field label="Guests" type="number" value={bookingForm.guests} onChange={(event) => setBookingForm({ ...bookingForm, guests: Number(event.target.value) })} />
                  <Field label="First name" value={bookingForm.firstName} onChange={(event) => setBookingForm({ ...bookingForm, firstName: event.target.value })} />
                  <Field label="Last name" value={bookingForm.lastName} onChange={(event) => setBookingForm({ ...bookingForm, lastName: event.target.value })} />
                  <Field label="Email" type="email" value={bookingForm.email} onChange={(event) => setBookingForm({ ...bookingForm, email: event.target.value })} />
                  <Field label="Phone" value={bookingForm.phone} onChange={(event) => setBookingForm({ ...bookingForm, phone: event.target.value })} />
                  <Field label="Country" value={bookingForm.country} onChange={(event) => setBookingForm({ ...bookingForm, country: event.target.value })} />
                  <SelectField label="Payment method" value={bookingForm.paymentMethod} onChange={(event) => setBookingForm({ ...bookingForm, paymentMethod: event.target.value as PaymentMethod })}>
                    {paymentMethods.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Booking status" value={bookingForm.status} onChange={(event) => setBookingForm({ ...bookingForm, status: event.target.value as BookingStatus })}>
                    {bookingStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </SelectField>
                  <SelectField label="Payment status" value={bookingForm.paymentStatus} onChange={(event) => setBookingForm({ ...bookingForm, paymentStatus: event.target.value as PaymentStatus })}>
                    {paymentStatuses.map((item) => (
                      <option key={item} value={item}>
                        {item.replace("_", " ")}
                      </option>
                    ))}
                  </SelectField>
                </div>
                <Button>Create Booking</Button>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}

function RoomOccupancyGrid({
  rooms,
  bookings,
  onRoomClick
}: {
  rooms: Room[];
  bookings: Booking[];
  onRoomClick: (room: Room) => void;
}) {
  return (
    <div className="room-occupancy-grid">
      {rooms.map((room, index) => {
        const activeBooking = getActiveBooking(room, bookings);
        return (
          <button
            type="button"
            key={room.id}
            className={`room-occupancy-card room-status-${room.status.toLowerCase().replace("_", "-")}`}
            onClick={() => onRoomClick(room)}
          >
            <span className="room-number">Room {String(index + 1).padStart(2, "0")}</span>
            <BedDouble size={22} />
            <strong>{room.name}</strong>
            <small>{roomStatusLabel(room.status)}</small>
            {activeBooking ? <em>{activeBooking.customer.firstName} {activeBooking.customer.lastName}</em> : null}
          </button>
        );
      })}
    </div>
  );
}
