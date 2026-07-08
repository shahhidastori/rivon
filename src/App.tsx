import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useLayoutEffect } from "react";
import { PublicLayout } from "./components/PublicLayout";
import { AdminLayout } from "./components/AdminLayout";
import { HomePage } from "./pages/public/HomePage";
import { RoomsPage } from "./pages/public/RoomsPage";
import { RoomDetailPage } from "./pages/public/RoomDetailPage";
import { BookingPage } from "./pages/public/BookingPage";
import { LookupPage } from "./pages/public/LookupPage";
import { StaticPage } from "./pages/public/StaticPage";
import { LoginPage } from "./pages/admin/LoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { AdminRooms } from "./pages/admin/AdminRooms";
import { AdminBookings } from "./pages/admin/AdminBookings";
import { AdminCustomers } from "./pages/admin/AdminCustomers";
import { AdminCms } from "./pages/admin/AdminCms";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminProfile } from "./pages/admin/AdminProfile";
import { trackAnalyticsEvent } from "./lib/analytics";

function ScrollToRouteTarget() {
  const { pathname, search, hash } = useLocation();

  useLayoutEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      const frame = window.requestAnimationFrame(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }));
      const timeout = window.setTimeout(() => window.scrollTo({ top: 0, left: 0, behavior: "auto" }), 250);
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
      };
    }

    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    let attempts = 0;
    let timeout: number | undefined;
    let frame: number | undefined;
    const targetId = hash.slice(1);

    const scrollToHashTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "auto" });
        return;
      }

      attempts += 1;
      if (attempts < 20) {
        timeout = window.setTimeout(scrollToHashTarget, 60);
      }
    };

    frame = window.requestAnimationFrame(scrollToHashTarget);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [pathname, search, hash]);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
      return () => {
        window.history.scrollRestoration = "auto";
      };
    }
    return undefined;
  }, []);

  return null;
}

function AnalyticsRouteTracker() {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (pathname.startsWith("/rooms") || pathname.startsWith("/booking")) return;

    if (pathname === "/") {
      if (!hash) {
        trackAnalyticsEvent("landing_page_view", { pageName: "Landing Page" });
        return;
      }

      const sectionNames: Record<string, string> = {
        "#about": "About Page",
        "#facilities": "Amenities Page",
        "#gallery": "Gallery Page",
        "#location": "Location Page",
        "#contact": "Contact Page"
      };
      trackAnalyticsEvent("page_view", { pageName: sectionNames[hash] || "Landing Page Section" });
      return;
    }

    const pageNames: Record<string, string> = {
      "/lookup": "Booking Lookup Page",
      "/terms": "Terms and Conditions Page",
      "/privacy": "Privacy Policy Page"
    };

    trackAnalyticsEvent("page_view", { pageName: pageNames[pathname] || "Public Page" });
  }, [pathname, search, hash]);

  return null;
}

export function App() {
  return (
    <>
      <ScrollToRouteTarget />
      <AnalyticsRouteTracker />
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:slug" element={<RoomDetailPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="booking/:slug" element={<BookingPage />} />
          <Route path="lookup" element={<LookupPage />} />
          <Route path="terms" element={<StaticPage />} />
          <Route path="privacy" element={<StaticPage />} />
        </Route>
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="rooms" element={<AdminRooms />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="customers" element={<AdminCustomers />} />
          <Route path="cms" element={<AdminCms />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="profile" element={<AdminProfile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
