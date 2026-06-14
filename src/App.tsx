import { Navigate, Route, Routes } from "react-router-dom";
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

export function App() {
  return (
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
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
