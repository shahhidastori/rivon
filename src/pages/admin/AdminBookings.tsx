import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Booking, BookingStatus, PaymentMethod, PaymentStatus, Room } from "../../types";
import { adminApi, currency, dateLabel } from "../../lib/api";
import { Button, Field, SelectField, StatusBadge } from "../../components/ui";

const bookingStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "CANCELLED"];
const paymentStatuses: PaymentStatus[] = ["UNPAID", "PAID", "PARTIALLY_PAID", "REFUNDED"];
const paymentMethods: PaymentMethod[] = ["CASH", "CARD", "BANK_TRANSFER"];

export function AdminBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
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
  });

  function load() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    adminApi.bookings(params.toString() ? `?${params}` : "").then((payload) => setBookings(payload.bookings));
    adminApi.rooms().then((payload) => {
      setRooms(payload.rooms);
      setForm((current) => ({ ...current, roomId: current.roomId || payload.rooms[0]?.id || "" }));
    });
  }

  useEffect(load, []);

  async function updateBooking(id: string, key: "status" | "paymentStatus", value: BookingStatus | PaymentStatus) {
    try {
      const payload = await adminApi.updateBooking(id, { [key]: value });
      setBookings((current) => current.map((booking) => (booking.id === id ? payload.booking : booking)));
      setMessage("Booking updated.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed.");
    }
  }

  async function createBooking(event: FormEvent) {
    event.preventDefault();
    try {
      await adminApi.createBooking({
        roomId: form.roomId,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: Number(form.guests),
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country
        },
        paymentMethod: form.paymentMethod,
        status: form.status,
        paymentStatus: form.paymentStatus
      });
      setMessage("Manual booking created.");
      setShowCreate(false);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Booking creation failed.");
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-heading inline">
        <div>
          <span>Operations</span>
          <h1>Booking Management</h1>
        </div>
        <Button type="button" onClick={() => setShowCreate((value) => !value)}>
          <Plus size={16} />
          Manual Booking
        </Button>
      </div>
      {message ? <div className={message.includes("failed") || message.includes("not") ? "alert error" : "alert success"}>{message}</div> : null}
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
        <form className="admin-card admin-form wide" onSubmit={createBooking}>
          <h2>Create Booking</h2>
          <div className="form-grid">
            <SelectField label="Room" value={form.roomId} onChange={(event) => setForm({ ...form, roomId: event.target.value })}>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </SelectField>
            <Field label="Check-in" type="date" value={form.checkIn} onChange={(event) => setForm({ ...form, checkIn: event.target.value })} />
            <Field label="Check-out" type="date" value={form.checkOut} onChange={(event) => setForm({ ...form, checkOut: event.target.value })} />
            <Field label="Guests" type="number" value={form.guests} onChange={(event) => setForm({ ...form, guests: Number(event.target.value) })} />
            <Field label="First name" value={form.firstName} onChange={(event) => setForm({ ...form, firstName: event.target.value })} />
            <Field label="Last name" value={form.lastName} onChange={(event) => setForm({ ...form, lastName: event.target.value })} />
            <Field label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <Field label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <SelectField
              label="Payment method"
              value={form.paymentMethod}
              onChange={(event) => setForm({ ...form, paymentMethod: event.target.value as PaymentMethod })}
            >
              {paymentMethods.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </SelectField>
            <SelectField label="Booking status" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as BookingStatus })}>
              {bookingStatuses.map((item) => (
                <option key={item} value={item}>
                  {item.replace("_", " ")}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Payment status"
              value={form.paymentStatus}
              onChange={(event) => setForm({ ...form, paymentStatus: event.target.value as PaymentStatus })}
            >
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
    </section>
  );
}
