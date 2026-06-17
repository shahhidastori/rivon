import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { addDays as addDateFnsDays, differenceInCalendarDays, format } from "date-fns";
import {
  ArrowLeft,
  BedDouble,
  CalendarDays,
  Car,
  CheckCircle2,
  Coffee,
  CreditCard,
  Landmark,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  Wifi
} from "lucide-react";
import type { Booking, PaymentMethod, Room } from "../../types";
import { currency, dateLabel, publicApi } from "../../lib/api";
import { Button, Field, SelectField, TextArea } from "../../components/ui";
import { GlassDatePicker, addDays, fromDateInputValue, toDateInputValue } from "../../components/GlassDatePicker";
import { BookingPageSkeleton } from "../../components/Skeletons";

const paymentMethods: Array<{ value: PaymentMethod; label: string; description: string; icon: typeof Wallet }> = [
  { value: "CARD", label: "Credit/Debit Card", description: "Admin confirms the secure payment link.", icon: CreditCard },
  { value: "BANK_TRANSFER", label: "Bank Transfer", description: "Verify within 24 hours.", icon: Landmark },
  { value: "CASH", label: "Cash on Arrival", description: "Pay at the front desk.", icon: Wallet }
];

const stayEnhancements = [
  { title: "Airport Transfer", body: "Luxury sedan pickup from Skardu Airport.", price: "On request", icon: Car },
  { title: "Local Breakfast", body: "Traditional breakfast served with mountain tea.", price: "Included", icon: Coffee },
  { title: "Tour Assistance", body: "Concierge guidance for lakes, valleys, and viewpoints.", price: "Included", icon: Sparkles }
];

export function BookingPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const initialCheckIn = params.get("checkIn") || format(addDateFnsDays(new Date(), 1), "yyyy-MM-dd");
  const initialCheckOut = params.get("checkOut") || format(addDateFnsDays(new Date(), 3), "yyyy-MM-dd");
  const initialGuests = Math.max(1, Number(params.get("guests") || 2));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [form, setForm] = useState({
    checkIn: initialCheckIn,
    checkOut: initialCheckOut,
    guests: initialGuests,
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
  const progressStep = step <= 2 ? 1 : step === 3 ? 2 : 3;
  const selectedPayment = paymentMethods.find((method) => method.value === form.paymentMethod) || paymentMethods[2];
  const bookingSearchParams = new URLSearchParams({
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    guests: String(Math.max(1, Number(form.guests) || 1))
  });
  const roomDetailBackLink = selectedRoom
    ? {
        pathname: `/rooms/${selectedRoom.slug}`,
        search: `?${bookingSearchParams.toString()}`
      }
    : "/rooms";

  const roomOptions = useMemo(
    () =>
      rooms.map((room) => ({
        value: room.id,
        label: `${room.name} - ${currency(room.pricePerNight)} / night`
      })),
    [rooms]
  );

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateCheckIn(value: string) {
    setForm((current) => {
      const next = { ...current, checkIn: value };
      if (fromDateInputValue(current.checkOut) <= fromDateInputValue(value)) {
        next.checkOut = toDateInputValue(addDays(fromDateInputValue(value), 1));
      }
      return next;
    });
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

  if (loading) return <BookingPageSkeleton />;

  return (
    <main className="page-wrap booking-page premium-booking-page">
      <Link to={roomDetailBackLink} className="back-link" viewTransition>
        <ArrowLeft size={14} />
        Back to Room Details
      </Link>

      <div className="booking-progress-line" aria-label="Booking progress">
        {["Review Stay", "Guest Details", "Payment"].map((label, index) => (
          <div key={label} className={progressStep >= index + 1 ? "active" : ""}>
            <span>{index + 1}</span>
            <strong>{label}</strong>
          </div>
        ))}
      </div>

      <form className="booking-workspace" onSubmit={submit}>
        <section className="booking-main-panel">
          {error ? <div className="alert error">{error}</div> : null}

          {step === 1 ? (
            <div className="booking-step-content">
              <span className="section-kicker">1. Review Your Selection</span>
              <div className="review-selection-card">
                {selectedRoom ? <img src={selectedRoom.images[0]?.url} alt={selectedRoom.name} /> : null}
                <div>
                  <h2>Choose dates and guests</h2>
                  <p>Start with your arrival details. You can still change the room before guest details.</p>
                  <div className="form-grid">
                    <GlassDatePicker
                      label="Check-in"
                      value={form.checkIn}
                      minDate={format(addDateFnsDays(new Date(), 1), "yyyy-MM-dd")}
                      onChange={updateCheckIn}
                    />
                    <GlassDatePicker
                      label="Check-out"
                      value={form.checkOut}
                      minDate={toDateInputValue(addDays(fromDateInputValue(form.checkIn), 1))}
                      onChange={(value) => update("checkOut", value)}
                    />
                    <Field
                      label="Guests"
                      type="number"
                      min={1}
                      value={form.guests}
                      onChange={(event) => update("guests", Number(event.target.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="booking-step-content">
              <span className="section-kicker">1. Review Your Selection</span>
              <h1>Select Your Room</h1>
              <SelectField label="Quick room selection" value={form.roomId} onChange={(event) => update("roomId", event.target.value)}>
                {roomOptions.map((room) => (
                  <option key={room.value} value={room.value}>
                    {room.label}
                  </option>
                ))}
              </SelectField>
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
                      {currency(room.pricePerNight)} / night - up to {room.capacity} guests
                    </small>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="booking-step-content">
              <span className="section-kicker">2. Guest Details</span>
              <h1>Who should we welcome?</h1>
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
            </div>
          ) : null}

          {step === 4 ? (
            <div className="booking-step-content payment-step">
              <span className="section-kicker">3. Payment</span>
              <h1>Review and secure your stay</h1>

              <section className="review-selection-card compact-review-card">
                {selectedRoom ? <img src={selectedRoom.images[0]?.url} alt={selectedRoom.name} /> : null}
                <div>
                  <h2>{selectedRoom?.name}</h2>
                  <div className="booking-mini-facts">
                    <span>
                      <CalendarDays size={14} /> {dateLabel(form.checkIn)} - {dateLabel(form.checkOut)}
                    </span>
                    <span>
                      <Users size={14} /> {form.guests} guests
                    </span>
                    <span>
                      <BedDouble size={14} /> {selectedRoom?.beds} beds
                    </span>
                    <span>
                      <Wifi size={14} /> High-speed WiFi
                    </span>
                  </div>
                </div>
                <strong>
                  {currency(selectedRoom?.pricePerNight || 0)} <small>/ night</small>
                </strong>
              </section>

              <section className="enhancement-list">
                <h2>Enhance Your Stay</h2>
                {stayEnhancements.map(({ title, body, price, icon: Icon }) => (
                  <article key={title}>
                    <Icon size={18} />
                    <div>
                      <strong>{title}</strong>
                      <span>{body}</span>
                    </div>
                    <em>{price}</em>
                  </article>
                ))}
              </section>

              <section className="secure-payment-block">
                <h2>Secure Payment</h2>
                <div className="payment-grid">
                  {paymentMethods.map(({ value, label, description, icon: Icon }) => (
                    <button
                      type="button"
                      className={form.paymentMethod === value ? "payment-option active" : "payment-option"}
                      key={value}
                      onClick={() => update("paymentMethod", value)}
                    >
                      <Icon size={22} />
                      <strong>{label}</strong>
                      <span>{description}</span>
                    </button>
                  ))}
                </div>
                <div className="payment-instructions">
                  <ShieldCheck size={18} />
                  <p>
                    Selected method: <strong>{selectedPayment.label}</strong>. Your reservation request is submitted
                    securely, and payment status is managed by the hotel team.
                  </p>
                </div>
              </section>
            </div>
          ) : null}

          {step === 5 && confirmed ? (
            <div className="confirmation-card">
              <CheckCircle2 size={52} />
              <h2>Booking Submitted</h2>
              <p>Your booking reference is:</p>
              <strong>{confirmed.reference}</strong>
              <p>
                We sent the confirmation to {confirmed.customer.email}. Use your reference and email to manage this
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
                  Confirm & Book Now
                </Button>
              )}
            </div>
          ) : null}
        </section>

        <aside className="booking-summary-card booking-total-card">
          <span className="section-kicker">Transaction in PKR</span>
          <h2>Booking Summary</h2>
          {selectedRoom ? (
            <>
              <div className="summary-room-line">
                <strong>{selectedRoom.name}</strong>
                <span>{currency(total)}</span>
                <small>
                  {nights} nights x {currency(selectedRoom.pricePerNight)}
                </small>
              </div>
              <dl className="summary-list compact-summary">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{currency(total)}</dd>
                </div>
                <div>
                  <dt>Booking fees</dt>
                  <dd>PKR 0</dd>
                </div>
                <div>
                  <dt>Total payable</dt>
                  <dd>{currency(total)}</dd>
                </div>
              </dl>
            </>
          ) : null}
          <p className="booking-assurance">
            <ShieldCheck size={16} />
            Bookings are 100% secure and confirmed by the hotel team.
          </p>
          {step === 4 ? (
            <Button type="submit" loading={submitting}>
              Confirm & Book Now
            </Button>
          ) : null}
        </aside>
      </form>
    </main>
  );
}
