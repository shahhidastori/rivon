import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  MonitorSmartphone,
  MousePointerClick,
  PieChart,
  Route,
  TrendingUp,
  Users,
  XCircle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { AnalyticsReport } from "../../types";
import { adminApi, currency } from "../../lib/api";
import { EmptyState } from "../../components/ui";
import { AdminDashboardSkeleton } from "../../components/Skeletons";

type AnalyticsRange = AnalyticsReport["range"]["key"];
type MetricValue = string | number;
type ChartRow = { label: string; count: number };
type TrendRow = { label: string; count: number; amount?: number };

const rangeOptions: Array<{ value: AnalyticsRange; label: string }> = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "month", label: "This month" },
  { value: "custom", label: "Custom" }
];

const donutColors = ["#b99354", "#2f7d53", "#806335", "#d7bb76", "#6d6a62", "#bd3d32"];

function todayValue() {
  return new Date().toISOString().slice(0, 10);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

function buildAnalyticsQuery(range: AnalyticsRange, startDate: string, endDate: string) {
  const params = new URLSearchParams({ range });
  if (range === "custom") {
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);
  }
  return `?${params.toString()}`;
}

export function AdminAnalytics() {
  const [range, setRange] = useState<AnalyticsRange>("7d");
  const [startDate, setStartDate] = useState(todayValue());
  const [endDate, setEndDate] = useState(todayValue());
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    adminApi
      .analytics(buildAnalyticsQuery(range, startDate, endDate))
      .then(setReport)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [endDate, range, startDate]);

  const summaryCards = useMemo(() => {
    if (!report) return [];
    return [
      ["Total Visits", formatNumber(report.summary.totalVisits), MousePointerClick],
      ["Unique Visitors", formatNumber(report.summary.uniqueVisitors), Users],
      ["Booking Started", formatNumber(report.summary.bookingStarted), Route],
      ["Booking Completed", formatNumber(report.summary.bookingCompleted), CheckCircle2],
      ["Booking Cancelled", formatNumber(report.summary.bookingCancelled), XCircle],
      ["Conversion Rate", formatPercent(report.summary.visitToBookingConversionRate), TrendingUp],
      ["Abandonment Rate", formatPercent(report.summary.bookingAbandonmentRate), Activity]
    ] as const;
  }, [report]);

  if (loading && !report) return <AdminDashboardSkeleton />;

  return (
    <section className="admin-page analytics-page">
      <div className="admin-heading analytics-heading">
        <div>
          <span>Insights</span>
          <h1>Analytics</h1>
        </div>
        <div className="analytics-date-filter" aria-label="Analytics date filter">
          {rangeOptions.map((option) => (
            <button
              type="button"
              className={range === option.value ? "active" : ""}
              key={option.value}
              onClick={() => setRange(option.value)}
            >
              {option.label}
            </button>
          ))}
          {range === "custom" ? (
            <div className="analytics-custom-dates">
              <label>
                <CalendarDays size={14} />
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label>
                <CalendarDays size={14} />
                <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
              </label>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <div className="alert error">{error}</div> : null}
      {loading ? <div className="analytics-refresh">Refreshing analytics...</div> : null}

      {report ? (
        <>
          <div className="metric-grid analytics-metric-grid">
            {summaryCards.map(([label, value, Icon]) => (
              <MetricCard key={label} label={label} value={value} icon={Icon} />
            ))}
          </div>

          <section className="analytics-visitor-strip admin-card">
            <div>
              <span>New Visitors</span>
              <strong>{formatNumber(report.summary.newVisitors)}</strong>
            </div>
            <div>
              <span>Returning Visitors</span>
              <strong>{formatNumber(report.summary.returningVisitors)}</strong>
            </div>
            <div>
              <span>Booking Completion</span>
              <strong>{formatPercent(report.summary.bookingCompletionRate)}</strong>
            </div>
            <div>
              <span>Cancellation Rate</span>
              <strong>{formatPercent(report.summary.cancellationRate)}</strong>
            </div>
          </section>

          {report.summary.totalVisits === 0 && report.summary.bookingStarted === 0 ? (
            <EmptyState
              title="No analytics data yet"
              body="New visits and booking events will appear here as guests browse the website."
            />
          ) : null}

          <div className="analytics-grid">
            <ChartCard title="Landing page visits" subtitle="Last 7 days" icon={TrendingUp}>
              <LineChart data={report.trends.landingVisitsLast7Days} />
            </ChartCard>

            <ChartCard title="Internal page visits" subtitle="Most viewed pages" icon={BarChart3}>
              <BarChart data={report.charts.pageVisits} />
            </ChartCard>

            <ChartCard title="Booking flow journey" subtitle="Step-by-step funnel" icon={Route} wide>
              <FunnelChart data={report.charts.funnel} />
            </ChartCard>

            <ChartCard title="Completed bookings" subtitle="Selected date range" icon={CheckCircle2}>
              <LineChart data={report.trends.completedBookings} amountLabel />
            </ChartCard>

            <ChartCard title="Cancelled bookings" subtitle="Selected date range" icon={XCircle}>
              <BarChart data={report.trends.cancelledBookings} />
            </ChartCard>

            <ChartCard title="Device usage" subtitle="Visitor devices" icon={MonitorSmartphone}>
              <DonutChart data={report.charts.deviceUsage} />
            </ChartCard>

            <ChartCard title="Browser usage" subtitle="Detected browsers" icon={PieChart}>
              <BarChart data={report.charts.browserUsage} compact />
            </ChartCard>

            <ChartCard title="Traffic sources" subtitle="Referrer overview" icon={Activity}>
              <BarChart data={report.charts.topReferrers} compact />
            </ChartCard>
          </div>

          <div className="analytics-table-grid">
            <RoomInsightsTable title="Top visited rooms" rows={report.tables.topVisitedRooms} mode="views" />
            <RoomInsightsTable title="Most booked rooms" rows={report.tables.mostBookedRooms} mode="bookings" />
            <HighViewLowBookingTable rows={report.tables.highViewLowBookingRooms} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: MetricValue; icon: LucideIcon }) {
  return (
    <article className="metric-card">
      <Icon size={22} />
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function ChartCard({
  title,
  subtitle,
  icon: Icon,
  wide,
  children
}: {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={wide ? "admin-card analytics-card analytics-card-wide" : "admin-card analytics-card"}>
      <div className="analytics-card-heading">
        <div>
          <Icon size={18} />
          <span>{subtitle}</span>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function LineChart({ data, amountLabel = false }: { data: TrendRow[]; amountLabel?: boolean }) {
  const max = Math.max(...data.map((item) => item.count), 1);
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 150 : (index / (data.length - 1)) * 300 + 10;
    const y = 130 - (item.count / max) * 105;
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <div className="analytics-line-chart">
      {data.length === 0 ? (
        <EmptyState title="No trend data" body="Events will appear once visitors use the website." />
      ) : (
        <>
          <svg viewBox="0 0 320 160" role="img" aria-label="Line chart">
            <path d={path} />
            {points.map((point) => (
              <circle key={`${point.label}-${point.x}`} cx={point.x} cy={point.y} r="4" />
            ))}
          </svg>
          <div className="chart-axis-labels">
            {points.map((point) => (
              <span key={point.label}>
                <strong>{point.count}</strong>
                <small>{point.label}</small>
                {amountLabel && point.amount ? <small>{currency(point.amount)}</small> : null}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function BarChart({ data, compact = false }: { data: ChartRow[]; compact?: boolean }) {
  const max = Math.max(...data.map((item) => item.count), 1);

  if (data.length === 0) {
    return <EmptyState title="No data yet" body="This chart will populate as events are tracked." />;
  }

  return (
    <div className={compact ? "analytics-bar-chart compact" : "analytics-bar-chart"}>
      {data.map((item) => (
        <div className="analytics-bar-row" key={item.label}>
          <span title={item.label}>{item.label}</span>
          <div>
            <i style={{ width: `${Math.max(6, (item.count / max) * 100)}%` }} />
          </div>
          <strong>{formatNumber(item.count)}</strong>
        </div>
      ))}
    </div>
  );
}

function FunnelChart({ data }: { data: AnalyticsReport["charts"]["funnel"] }) {
  const max = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="analytics-funnel">
      {data.map((item, index) => (
        <div className="analytics-funnel-row" key={item.eventType}>
          <span>{index + 1}</span>
          <div>
            <strong>{item.label}</strong>
            <i style={{ width: `${Math.max(4, (item.count / max) * 100)}%` }} />
          </div>
          <b>{formatNumber(item.count)}</b>
        </div>
      ))}
    </div>
  );
}

function DonutChart({ data }: { data: ChartRow[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  let cursor = 0;
  const gradient =
    total === 0
      ? "#ece6d8"
      : data
          .map((item, index) => {
            const start = cursor;
            const end = cursor + (item.count / total) * 100;
            cursor = end;
            return `${donutColors[index % donutColors.length]} ${start}% ${end}%`;
          })
          .join(", ");

  return (
    <div className="analytics-donut-wrap">
      <div className="analytics-donut" style={{ background: `conic-gradient(${gradient})` }}>
        <strong>{formatNumber(total)}</strong>
        <span>events</span>
      </div>
      <div className="analytics-donut-legend">
        {data.length === 0 ? <span>No device data yet</span> : null}
        {data.map((item, index) => (
          <span key={item.label}>
            <i style={{ backgroundColor: donutColors[index % donutColors.length] }} />
            {item.label}
            <strong>{formatPercent(total ? (item.count / total) * 100 : 0)}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

function RoomInsightsTable({
  title,
  rows,
  mode
}: {
  title: string;
  rows: AnalyticsReport["tables"]["topVisitedRooms"];
  mode: "views" | "bookings";
}) {
  return (
    <section className="admin-card analytics-table-card">
      <h2>{title}</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>{mode === "views" ? "Views" : "Bookings"}</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3}>No room data yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.roomId}>
                  <td>{row.roomName}</td>
                  <td>{formatNumber(row.count)}</td>
                  <td>{row.amount ? currency(row.amount) : "PKR 0"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function HighViewLowBookingTable({ rows }: { rows: AnalyticsReport["tables"]["highViewLowBookingRooms"] }) {
  return (
    <section className="admin-card analytics-table-card">
      <h2>High views, low bookings</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Room</th>
              <th>Views</th>
              <th>Bookings</th>
              <th>Conversion</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4}>No mismatch detected yet.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.roomId}>
                  <td>{row.roomName}</td>
                  <td>{formatNumber(row.views)}</td>
                  <td>{formatNumber(row.bookings)}</td>
                  <td>{formatPercent(row.conversionRate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
