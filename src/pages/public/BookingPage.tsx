import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { addDays, differenceInCalendarDays, format } from "date-fns";
import { CheckCircle2, CreditCard, Landmark, Wallet } from "lucide-react";
import type { Booking, PaymentMethod, Room } from "../../types";
import { currency, dateLabel, publicApi } from "../../lib/api";
import { Button, Field, SelectField, TextArea } from "../../components/ui";

const paymentMethods: Array<{ value: PaymentMethod; label: string; icon: typeof Wallet }> = [
  { value: "CASH", label: "Cash at Property", icon: Wallet },
  { value: "CARD", label: "Card", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Landmark }
];

export function BookingPage() {
  const { slug } = useParams();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    checkIn: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    checkOut: format(addDays(new Date(), 3), "yyyy-MM-dd"),
    guests: 2,
    roomId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "",
    specialRequests: "",
    paymentMethod: "CASH" as PaymentMethod
  });

  useEffect(() => {
    publicApi
      .rooms()
      .then((payload) => {
        setRooms(payload.rooms);
        const selected = payload.rooms.find((room) => room.slug === slug) || payload.rooms[0];
        if (selected) setForm((current) => ({ ...current, roomId: selected.id }));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  const selectedRoom = rooms.find((room) => room.id === form.roomId);
  const nights = Math.max(1, differenceInCalendarDays(new Date(form.checkOut), new Date(form.checkIn)));
  const total = selectedRoom ? nights * selectedRoom.pricePerNight : 0;

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function next() {
    setError("");
    if (step === 1 && (!form.checkIn || !form.checkOut || new Date(form.checkOut) <= new Date(form.checkIn))) {
      setError("Choose a valid check-in and check-out date.");
      return;
    }
    if (step === 2 && !form.roomId) {
      setError("Select a room to continue.");
      return;
    }
    if (step === 3 && (!form.firstName || !form.lastName || !form.email || !form.phone)) {
      setError("Enter customer name, email, and phone.");
      return;
    }
    setStep((value) => Math.min(4, value + 1));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedRoom) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = await publicApi.createBooking({
        roomId: selectedRoom.id,
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
        specialRequests: form.specialRequests,
        paymentMethod: form.paymentMethod
      });
      setConfirmed(payload.booking);
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loader">Loading booking flow...</div>;

  return (
    <main className="page-wrap booking-page">
      <section className="page-hero compact">
        <span className="section-kicker">Booking</span>
        <h1>Reserve your stay</h1>
      </section>

      <div className="booking-shell">
        <aside className="stepper-card">
          {["Dates & Guests", "Select Room", "Customer Details", "Review & Payment", "Confirmation"].map(
            (label, index) => (
              <button key={label} className={step === index + 1 ? "active" : step > index + 1 ? "done" : ""}>
                <span>{index + 1}</span>
                {label}
              </button>
            )
          )}
        </aside>

        <form className="booking-panel" onSubmit={submit}>
          {error ? <div className="alert error">{error}</div> : null}

          {step === 1 ? (
            <div className="form-grid">
              <Field label="Check-in" type="date" value={form.checkIn} onChange={(event) => update("checkIn", event.target.value)} />
              <Field
                label="Check-out"
                type="date"
                value={form.checkOut}
                onChange={(event) => update("checkOut", event.target.value)}
              />
              <Field
                label="Guests"
                type="number"
                min={1}
                value={form.guests}
                onChange={(event) => update("guests", Number(event.target.value))}
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="select-room-grid">
              {rooms.map((room) => (
                <button
                  type="button"
                  className={form.roomId === room.id ? "booking-room active" : "booking-room"}
                  key={room.id}
                  onClick={() => update("roomId", room.id)}
                >
                  <img src={room.images[0]?.url} alt={room.name} />
                  <span>{room.type}</span>
                  <strong>{room.name}</strong>
                  <small>
                    {currency(room.pricePerNight)} / night · {room.capacity} guests
                  </small>
                </button>
              ))}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="form-grid">
              <Field label="First name" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} />
              <Field label="Last name" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} />
              <Field label="Email" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
              <Field label="Phone" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
              <Field label="Country" value={form.country} onChange={(event) => update("country", event.target.value)} />
              <TextArea
                label="Special requests"
                value={form.specialRequests}
                onChange={(event) => update("specialRequests", event.target.value)}
              />
            </div>
          ) : null}

          {step === 4 ? (
            <div className="review-layout">
              <section>
                <h2>Booking Summary</h2>
                <dl className="summary-list">
                  <div>
                    <dt>Room</dt>
                    <dd>{selectedRoom?.name}</dd>
                  </div>
                  <div>
                    <dt>Dates</dt>
                    <dd>
                      {dateLabel(form.checkIn)} - {dateLabel(form.checkOut)}
                    </dd>
                  </div>
                  <div>
                    <dt>Guests</dt>
                    <dd>{form.guests}</dd>
                  </div>
                  <div>
                    <dt>Total</dt>
                    <dd>{currency(total)}</dd>
                  </div>
                </dl>
              </section>
              <section>
                <h2>Payment Method</h2>
                <div className="payment-grid">
                  {paymentMethods.map(({ value, label, icon: Icon }) => (
                    <button
                      type="button"
                      className={form.paymentMethod === value ? "payment-option active" : "payment-option"}
                      key={value}
                      onClick={() => update("paymentMethod", value)}
                    >
                      <Icon size={20} />
                      {label}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {step === 5 && confirmed ? (
            <div className="confirmation-card">
              <CheckCircle2 size={44} />
              <h2>Booking Submitted</h2>
              <p>Your booking reference is:</p>
              <strong>{confirmed.reference}</strong>
              <p>
                Rivon sent the confirmation to {confirmed.customer.email}. Use your reference and email to manage this
                booking.
              </p>
              <div className="hero-actions">
                <Link to="/lookup" className="btn btn-dark">
                  Manage Booking
                </Link>
                <Link to="/" className="btn btn-ghost">
                  Back Home
                </Link>
              </div>
            </div>
          ) : null}

          {step < 5 ? (
            <div className="booking-actions">
              <Button type="button" variant="ghost" disabled={step === 1} onClick={() => setStep((value) => value - 1)}>
                Back
              </Button>
              {step < 4 ? (
                <Button type="button" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="submit" loading={submitting}>
                  Submit Booking
                </Button>
              )}
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}
