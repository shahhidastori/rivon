import { FormEvent, useState } from "react";
import { dateLabel, publicApi, currency } from "../../lib/api";
import { getAnalyticsContext } from "../../lib/analytics";
import type { Booking } from "../../types";
import { Button, Field, StatusBadge } from "../../components/ui";

export function LookupPage() {
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function lookup(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setBooking(null);
    try {
      const payload = await publicApi.lookupBooking({ reference, email });
      setBooking(payload.booking);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Booking not found.");
    } finally {
      setLoading(false);
    }
  }

  async function cancel() {
    if (!booking) return;
    setLoading(true);
    setMessage("");
    try {
      const payload = await publicApi.cancelBooking(
        booking.reference,
        email,
        getAnalyticsContext({
          pageName: "Booking Lookup Page",
          roomId: booking.room.id,
          metadata: {
            reference: booking.reference,
            roomName: booking.room.name,
            roomType: booking.room.type,
            status: booking.status
          }
        })
      );
      setBooking(payload.booking);
      setMessage("Booking cancelled successfully.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Unable to cancel booking.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page-wrap lookup-page">
      <section className="page-hero compact">
        <span className="section-kicker">Guest Portal</span>
        <h1>Find and manage your booking</h1>
      </section>
      <div className="lookup-layout">
        <form className="lookup-card" onSubmit={lookup}>
          <Field label="Booking reference" value={reference} onChange={(event) => setReference(event.target.value)} />
          <Field label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          <Button loading={loading}>Search Booking</Button>
          {message ? <div className={message.includes("success") ? "alert success" : "alert error"}>{message}</div> : null}
        </form>

        {booking ? (
          <section className="booking-detail-card">
            <div className="room-list-title">
              <div>
                <span>{booking.reference}</span>
                <h2>{booking.room.name}</h2>
              </div>
              <StatusBadge value={booking.status} />
            </div>
            <dl className="summary-list">
              <div>
                <dt>Guest</dt>
                <dd>
                  {booking.customer.firstName} {booking.customer.lastName}
                </dd>
              </div>
              <div>
                <dt>Dates</dt>
                <dd>
                  {dateLabel(booking.checkIn)} - {dateLabel(booking.checkOut)}
                </dd>
              </div>
              <div>
                <dt>Payment</dt>
                <dd>
                  <StatusBadge value={booking.paymentStatus} />
                </dd>
              </div>
              <div>
                <dt>Total</dt>
                <dd>{currency(booking.totalAmount)}</dd>
              </div>
            </dl>
            <Button variant="danger" disabled={!booking.canCancel || loading} onClick={cancel}>
              Cancel Booking
            </Button>
            {!booking.canCancel ? <p className="hint">This booking is outside the online cancellation window.</p> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
