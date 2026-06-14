import { FormEvent, useEffect, useState } from "react";
import type { Customer } from "../../types";
import { adminApi, currency, dateLabel } from "../../lib/api";
import { EmptyState, StatusBadge } from "../../components/ui";

export function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  function load() {
    adminApi
      .customers(search ? `?search=${encodeURIComponent(search)}` : "")
      .then((payload) => {
        setCustomers(payload.customers);
        setSelected(payload.customers[0] || null);
      });
  }

  useEffect(load, []);

  function submit(event: FormEvent) {
    event.preventDefault();
    load();
  }

  return (
    <section className="admin-page customer-admin">
      <div className="admin-heading inline">
        <div>
          <span>Guests</span>
          <h1>Customer Management</h1>
        </div>
        <form className="admin-search" onSubmit={submit}>
          <input placeholder="Search guests" value={search} onChange={(event) => setSearch(event.target.value)} />
        </form>
      </div>

      <div className="customer-layout">
        <aside className="admin-card customer-list">
          {customers.length === 0 ? <EmptyState title="No customers" body="Customers appear here after bookings." /> : null}
          {customers.map((customer) => (
            <button key={customer.id} className={selected?.id === customer.id ? "active" : ""} onClick={() => setSelected(customer)}>
              <strong>
                {customer.firstName} {customer.lastName}
              </strong>
              <span>{customer.email}</span>
              <small>{customer.bookings?.length || 0} bookings</small>
            </button>
          ))}
        </aside>

        <section className="admin-card customer-detail">
          {selected ? (
            <>
              <div className="section-heading-row">
                <div>
                  <span className="section-kicker">Profile</span>
                  <h2>
                    {selected.firstName} {selected.lastName}
                  </h2>
                </div>
                <span>{selected.phone}</span>
              </div>
              <p>{selected.email}</p>
              <h3>Booking History</h3>
              <div className="table-wrap embedded">
                <table>
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Status</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.bookings?.map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.reference}</td>
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
            </>
          ) : (
            <EmptyState title="Select a customer" body="Choose a customer to view profile and booking history." />
          )}
        </section>
      </div>
    </section>
  );
}
