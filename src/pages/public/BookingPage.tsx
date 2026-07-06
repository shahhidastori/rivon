import { FormEvent, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { addDays as addDateFnsDays, differenceInCalendarDays, format } from "date-fns";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileText,
  Landmark,
  ShieldCheck,
  Upload,
  Wallet
} from "lucide-react";
import type { Booking, PaymentMethod, Room } from "../../types";
import { currency, dateLabel, publicApi } from "../../lib/api";
import { getAnalyticsContext, trackAnalyticsEvent } from "../../lib/analytics";
import { Button, Field, TextArea } from "../../components/ui";
import { BookingPageSkeleton } from "../../components/Skeletons";

const paymentMethods: Array<{
  value: Extract<PaymentMethod, "BANK_TRANSFER" | "CASH">;
  label: string;
  description: string;
  icon: typeof Wallet;
}> = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", description: "Attach a receipt after transfer.", icon: Landmark },
  { value: "CASH", label: "Cash on Arrival", description: "Pay at the front desk.", icon: Wallet }
];

const bookingSteps = ["Room Listing", "Room Details", "Guest & Payment"];
type BookingProgressState = "completed" | "active" | "inactive";

export function BookingPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const initialCheckIn = params.get("checkIn") || format(addDateFnsDays(new Date(), 1), "yyyy-MM-dd");
  const initialCheckOut = params.get("checkOut") || format(addDateFnsDays(new Date(), 3), "yyyy-MM-dd");
  const initialGuests = Math.max(1, Number(params.get("guests") || 2));
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<Booking | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const trackedBookingKey = useRef("");
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
    paymentMethod: "BANK_TRANSFER" as PaymentMethod
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
  const guestCount = selectedRoom ? Math.max(1, Math.min(selectedRoom.capacity, Number(form.guests) || 1)) : Math.max(1, Number(form.guests) || 1);
  const selectedPayment = paymentMethods.find((method) => method.value === form.paymentMethod) || paymentMethods[1];
  const bookingSearchParams = new URLSearchParams({
    checkIn: form.checkIn,
    checkOut: form.checkOut,
    guests: String(guestCount)
  });
  const roomDetailBackLink = selectedRoom
    ? {
        pathname: `/rooms/${selectedRoom.slug}`,
        search: `?${bookingSearchParams.toString()}`
      }
    : "/rooms";

  useEffect(() => {
    if (!selectedRoom || confirmed) return;
    const key = `${selectedRoom.id}|${form.checkIn}|${form.checkOut}|${guestCount}`;
    if (trackedBookingKey.current === key) return;
    trackedBookingKey.current = key;

    const metadata = {
      roomName: selectedRoom.name,
      roomType: selectedRoom.type,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      guests: guestCount,
      nights,
      totalAmount: total
    };

    trackAnalyticsEvent("booking_started", {
      pageName: "Booking Started Page",
      roomId: selectedRoom.id,
      metadata
    });
    trackAnalyticsEvent("booking_preview_view", {
      pageName: "Booking Preview Page",
      roomId: selectedRoom.id,
      metadata
    });
    trackAnalyticsEvent("guest_details_view", {
      pageName: "Guest Details Page",
      roomId: selectedRoom.id,
      metadata
    });
    trackAnalyticsEvent("payment_step_view", {
      pageName: "Payment Step Page",
      roomId: selectedRoom.id,
      metadata
    });
  }, [confirmed, form.checkIn, form.checkOut, guestCount, nights, selectedRoom, total]);

  function update(key: keyof typeof form, value: string | number) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function getProgressState(stepNumber: number): BookingProgressState {
    if (confirmed) return "completed";
    if (stepNumber <= 2) return "completed";
    if (stepNumber === 3) return "active";
    return "inactive";
  }

  function validateStay() {
    setError("");
    if (!selectedRoom) {
      setError("Choose a room before continuing.");
      return false;
    }
    if (!form.checkIn || !form.checkOut || new Date(form.checkOut) <= new Date(form.checkIn)) {
      setError("Choose a valid check-in and check-out date.");
      return false;
    }
    if (guestCount > selectedRoom.capacity) {
      setError(`This room supports up to ${selectedRoom.capacity} guests.`);
      return false;
    }
    return true;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selectedRoom) return;
    if (!validateStay()) return;
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setError("Enter guest name, email, and phone.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const uploadedReceipt =
        form.paymentMethod === "BANK_TRANSFER" && receiptFile
          ? await publicApi.uploadReceipt(receiptFile)
          : null;
      const receiptNote =
        form.paymentMethod === "BANK_TRANSFER" && uploadedReceipt
          ? `Bank transfer receipt attached.`
          : "";
      const specialRequests = [form.specialRequests.trim(), receiptNote].filter(Boolean).join("\n");

      const payload = await publicApi.createBooking({
        roomId: selectedRoom.id,
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guests: guestCount,
        customer: {
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          country: form.country
        },
        specialRequests,
        paymentMethod: form.paymentMethod,
        receiptUrl: uploadedReceipt?.url,
        analytics: getAnalyticsContext({
          pageName: "Guest Details & Payment Page",
          roomId: selectedRoom.id,
          metadata: {
            roomName: selectedRoom.name,
            roomType: selectedRoom.type,
            checkIn: form.checkIn,
            checkOut: form.checkOut,
            guests: guestCount,
            nights,
            totalAmount: total,
            paymentMethod: form.paymentMethod,
            receiptAttached: Boolean(uploadedReceipt?.url)
          }
        })
      });
      setConfirmed(payload.booking);
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
        {bookingSteps.map((label, index) => {
          const progressState = getProgressState(index + 1);
          return (
            <div key={label} className={progressState} aria-current={progressState === "active" ? "step" : undefined}>
              <span>{progressState === "completed" ? <Check size={16} /> : index + 1}</span>
              <strong>{label}</strong>
            </div>
          );
        })}
      </div>

      {confirmed ? (
        <section className="booking-main-panel booking-confirmation-panel">
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
        </section>
      ) : (
        <form className="booking-workspace" onSubmit={submit}>
          <section className="booking-main-panel">
            {error ? <div className="alert error">{error}</div> : null}

            <div className="booking-step-content payment-step">
              <h1>Guest Details & Payment</h1>
              <p className="booking-step-intro">
                Add the guest information and choose how you would like to pay for this stay.
              </p>

              <div className="form-grid">
                <Field label="First name *" value={form.firstName} onChange={(event) => update("firstName", event.target.value)} />
                <Field label="Last name *" value={form.lastName} onChange={(event) => update("lastName", event.target.value)} />
                <Field label="Email *" type="email" value={form.email} onChange={(event) => update("email", event.target.value)} />
                <Field label="Phone *" value={form.phone} onChange={(event) => update("phone", event.target.value)} />
                <Field label="Country" value={form.country} onChange={(event) => update("country", event.target.value)} />
                <TextArea
                  label="Special requests"
                  value={form.specialRequests}
                  onChange={(event) => update("specialRequests", event.target.value)}
                />
              </div>

              <section className="secure-payment-block">
                <h2>Payment Method</h2>
                <div className="payment-grid booking-payment-grid">
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

                {form.paymentMethod === "BANK_TRANSFER" ? (
                  <label className="receipt-upload-card">
                    <Upload size={18} />
                    <span>
                      <strong>{receiptFile ? receiptFile.name : "Upload payment receipt"}</strong>
                      <small>PNG, JPG, or PDF. You can also send it later after transfer.</small>
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,application/pdf"
                      onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                    />
                  </label>
                ) : null}

                <div className="payment-instructions">
                  <ShieldCheck size={18} />
                  <p>
                    Selected method: <strong>{selectedPayment.label}</strong>. Your reservation request is submitted
                    securely, and the hotel team will update the payment status after review.
                  </p>
                </div>
              </section>
            </div>
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
                    <dt>Check-in</dt>
                    <dd>{dateLabel(form.checkIn)}</dd>
                  </div>
                  <div>
                    <dt>Check-out</dt>
                    <dd>{dateLabel(form.checkOut)}</dd>
                  </div>
                  <div>
                    <dt>Guests</dt>
                    <dd>{guestCount}</dd>
                  </div>
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
              <FileText size={16} />
              Final confirmation and payment status are managed by the Rivon team.
            </p>
            <div className="booking-actions booking-summary-actions">
              <Link to={roomDetailBackLink} className="btn btn-ghost" viewTransition>
                Back
              </Link>
              <Button type="submit" loading={submitting}>
                Confirm & Book Now
              </Button>
            </div>
          </aside>
        </form>
      )}
    </main>
  );
}
