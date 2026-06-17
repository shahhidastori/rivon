import { clsx } from "clsx";

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={clsx("skeleton-block", className)} aria-hidden="true" />;
}

function SkeletonLines({ count = 3 }: { count?: number }) {
  return (
    <div className="skeleton-lines" aria-hidden="true">
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonBlock key={index} className={index === count - 1 ? "short" : ""} />
      ))}
    </div>
  );
}

function SkeletonRoomCard() {
  return (
    <article className="room-list-item luxury-room-card skeleton-card">
      <SkeletonBlock className="skeleton-image" />
      <div className="room-card-body">
        <SkeletonBlock className="tiny" />
        <SkeletonBlock className="title" />
        <SkeletonLines count={3} />
        <div className="skeleton-chip-row">
          <SkeletonBlock className="chip" />
          <SkeletonBlock className="chip" />
          <SkeletonBlock className="chip" />
        </div>
      </div>
      <aside>
        <SkeletonBlock className="tiny" />
        <SkeletonBlock className="price" />
        <div className="room-card-actions">
          <SkeletonBlock className="button" />
          <SkeletonBlock className="button" />
        </div>
      </aside>
    </article>
  );
}

export function HomePageSkeleton() {
  return (
    <main className="minimal-home-page skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading hotel overview</span>
      <section className="minimal-hero skeleton-hero-shell">
        <div className="minimal-hero-frame skeleton-hero-frame">
          <div className="minimal-hero-content skeleton-hero-content">
            <SkeletonBlock className="eyebrow" />
            <SkeletonBlock className="hero-title" />
            <SkeletonBlock className="hero-title short" />
            <SkeletonBlock className="hero-copy" />
          </div>
          <div className="minimal-booking-bar skeleton-booking-bar">
            <SkeletonBlock className="field" />
            <SkeletonBlock className="field" />
            <SkeletonBlock className="field small" />
            <SkeletonBlock className="button" />
          </div>
        </div>
      </section>
      <section className="content-band about-band minimal-about-band skeleton-two-column">
        <div>
          <SkeletonBlock className="eyebrow" />
          <SkeletonBlock className="heading" />
          <SkeletonLines count={4} />
        </div>
        <SkeletonBlock className="feature-image" />
      </section>
      <section className="content-band center-band">
        <SkeletonBlock className="eyebrow centered" />
        <SkeletonBlock className="heading centered" />
        <div className="facility-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article className="facility-card skeleton-card" key={index}>
              <SkeletonBlock className="icon" />
              <SkeletonBlock className="title" />
              <SkeletonLines count={2} />
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export function RoomResultsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="room-result-grid skeleton-result-grid" role="status" aria-live="polite">
      <span className="sr-only">Loading available rooms</span>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonRoomCard key={index} />
      ))}
    </div>
  );
}

export function RoomDetailSkeleton() {
  return (
    <main className="page-wrap room-detail-page skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading room details</span>
      <nav className="breadcrumb-line" aria-hidden="true">
        <SkeletonBlock className="crumb" />
        <SkeletonBlock className="crumb small" />
        <SkeletonBlock className="crumb" />
      </nav>
      <section className="room-gallery detail-gallery skeleton-gallery">
        <SkeletonBlock className="gallery-main" />
        <div>
          <SkeletonBlock />
          <SkeletonBlock />
        </div>
      </section>
      <section className="detail-layout refined-detail-layout">
        <article className="detail-copy skeleton-detail-copy">
          <SkeletonBlock className="eyebrow" />
          <SkeletonBlock className="heading wide" />
          <div className="room-facts">
            <SkeletonBlock className="chip" />
            <SkeletonBlock className="chip" />
            <SkeletonBlock className="chip" />
          </div>
          <SkeletonLines count={5} />
          <div className="amenity-tile-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonBlock className="amenity" key={index} />
            ))}
          </div>
        </article>
        <aside className="detail-booking-stack">
          <div className="booking-summary-card detail-price-card skeleton-card">
            <SkeletonBlock className="price" />
            <SkeletonLines count={3} />
            <div className="mini-date-grid">
              <SkeletonBlock className="field" />
              <SkeletonBlock className="field" />
            </div>
            <SkeletonBlock className="button full" />
          </div>
        </aside>
      </section>
    </main>
  );
}

export function BookingPageSkeleton() {
  return (
    <main className="page-wrap booking-page premium-booking-page skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading booking flow</span>
      <SkeletonBlock className="back-link-skeleton" />
      <div className="booking-progress-line skeleton-progress" aria-hidden="true">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index}>
            <SkeletonBlock className="step-dot" />
            <SkeletonBlock className="step-label" />
          </div>
        ))}
      </div>
      <div className="booking-workspace">
        <section className="booking-main-panel skeleton-card">
          <SkeletonBlock className="eyebrow" />
          <SkeletonBlock className="heading" />
          <div className="review-selection-card">
            <SkeletonBlock className="booking-image" />
            <div>
              <SkeletonBlock className="title" />
              <SkeletonLines count={3} />
              <div className="form-grid">
                <SkeletonBlock className="field" />
                <SkeletonBlock className="field" />
                <SkeletonBlock className="field" />
              </div>
            </div>
          </div>
        </section>
        <aside className="booking-summary-card booking-total-card skeleton-card">
          <SkeletonBlock className="eyebrow" />
          <SkeletonBlock className="heading" />
          <SkeletonLines count={4} />
          <SkeletonBlock className="button full" />
        </aside>
      </div>
    </main>
  );
}

export function StaticPageSkeleton() {
  return (
    <main className="page-wrap static-page skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading page content</span>
      <section className="page-hero compact">
        <SkeletonBlock className="eyebrow" />
        <SkeletonBlock className="heading" />
      </section>
      <article className="policy-card skeleton-card">
        <SkeletonLines count={6} />
      </article>
    </main>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <section className="admin-page skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading dashboard</span>
      <div className="admin-heading">
        <SkeletonBlock className="eyebrow" />
        <SkeletonBlock className="heading" />
      </div>
      <div className="metric-grid">
        {Array.from({ length: 6 }).map((_, index) => (
          <article className="metric-card skeleton-card" key={index}>
            <SkeletonBlock className="icon" />
            <SkeletonBlock className="tiny" />
            <SkeletonBlock className="price" />
          </article>
        ))}
      </div>
      <section className="admin-card skeleton-card">
        <div className="section-heading-row">
          <div>
            <SkeletonBlock className="eyebrow" />
            <SkeletonBlock className="title" />
          </div>
          <SkeletonBlock className="price" />
        </div>
        <div className="skeleton-table">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock key={index} />
          ))}
        </div>
      </section>
    </section>
  );
}

export function AdminShellSkeleton() {
  return (
    <div className="admin-shell admin-shell-skeleton skeleton-page" role="status" aria-live="polite">
      <span className="sr-only">Loading admin session</span>
      <aside className="admin-sidebar">
        <SkeletonBlock className="admin-logo-skeleton" />
        <nav>
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock className="admin-nav-skeleton" key={index} />
          ))}
        </nav>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar">
          <SkeletonBlock className="title" />
          <SkeletonBlock className="button" />
        </header>
        <AdminDashboardSkeleton />
      </main>
    </div>
  );
}
