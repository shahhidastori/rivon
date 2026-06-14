import { useEffect, useState } from "react";
import { BedDouble, BookOpenCheck, CalendarClock, CircleDollarSign, Hotel, Percent } from "lucide-react";
import type { Booking } from "../../types";
import { adminApi, currency, dateLabel } from "../../lib/api";
import { StatusBadge } from "../../components/ui";

type Dashboard = Awaited<ReturnType<typeof adminApi.dashboard>>;

export function AdminDashboard() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.dashboard().then(setDashboard).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="alert error">{error}</div>;
  if (!dashboard) return <div className="page-loader">Loading dashboard...</div>;

  const cards = [
    ["Total Bookings", dashboard.totalBookings, BookOpenCheck],
    ["Pending", dashboard.pendingBookings, CalendarClock],
    ["Confirmed", dashboard.confirmedBookings, Hotel],
    ["Available Rooms", dashboard.availableRooms, BedDouble],
    ["Occupancy", `${dashboard.occupancyRate}%`, Percent],
    ["Paid Revenue", currency(dashboard.revenue.paid), CircleDollarSign]
  ] as const;

  return (
    <section className="admin-page">
      <div className="admin-heading">
        <span>Overview</span>
        <h1>Dashboard</h1>
      </div>
      <div className="metric-grid">
        {cards.map(([label, value, Icon]) => (
          <article className="metric-card" key={label}>
            <Icon size={22} />
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <section className="admin-card">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Bookings</span>
            <h2>Recent Bookings</h2>
          </div>
          <strong>{currency(dashboard.revenue.expected)} expected</strong>
        </div>
        <BookingTable bookings={dashboard.recentBookings} />
      </section>
    </section>
  );
}

function BookingTable({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Reference</th>
            <th>Guest</th>
            <th>Room</th>
            <th>Check-in</th>
            <th>Status</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td>{booking.reference}</td>
              <td>
                {booking.customer.firstName} {booking.customer.lastName}
              </td>
              <td>{booking.room.name}</td>
              <td>{dateLabel(booking.checkIn)}</td>
              <td>
                <StatusBadge value={booking.status} />
              </td>
              <td>{currency(booking.totalAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
