export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "UNAVAILABLE";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";
export type PaymentStatus = "UNPAID" | "PAID" | "PARTIALLY_PAID" | "REFUNDED";
export type PaymentMethod = "CASH" | "CARD" | "BANK_TRANSFER";

export type Amenity = {
  id: string;
  name: string;
  icon?: string | null;
};

export type RoomImage = {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type Room = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  pricePerNight: number;
  beds: number;
  capacity: number;
  sizeSqm?: number | null;
  status: RoomStatus;
  featured: boolean;
  hideFromWebsite: boolean;
  images: RoomImage[];
  amenities: Amenity[];
};

export type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  country?: string | null;
  notes?: string | null;
  bookings?: Booking[];
};

export type Payment = {
  id: string;
  method: PaymentMethod;
  amount: number;
  status: "PENDING" | "CAPTURED" | "FAILED" | "REFUNDED";
  transactionId?: string | null;
  paidAt?: string | null;
  notes?: string | null;
};

export type Booking = {
  id: string;
  reference: string;
  customer: Customer;
  room: Room;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  source: string;
  totalAmount: number;
  specialRequests?: string | null;
  payments: Payment[];
  canCancel: boolean;
  createdAt: string;
};

export type CmsSection = {
  id: string;
  key: string;
  title: string;
  subtitle?: string | null;
  body?: string | null;
  imageUrl?: string | null;
  metadataJson?: string | null;
  metadata?: unknown;
  updatedAt?: string;
};

export type CmsPage = {
  id: string;
  key: string;
  title: string;
  content: string;
  metadataJson?: string | null;
  metadata?: unknown;
  updatedAt?: string;
};

export type CmsPayload = {
  sections: Record<string, CmsSection>;
  pages: Record<string, CmsPage>;
};

export type AdminProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AnalyticsEventType =
  | "page_view"
  | "landing_page_view"
  | "room_listing_view"
  | "room_detail_view"
  | "booking_started"
  | "booking_preview_view"
  | "guest_details_view"
  | "payment_step_view"
  | "booking_completed"
  | "booking_cancelled"
  | "booking_abandoned";

export type AnalyticsContext = {
  pageUrl?: string;
  pageName?: string;
  sessionId?: string;
  visitorId?: string;
  userId?: string;
  roomId?: string;
  deviceType?: string;
  browser?: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
};

export type AnalyticsReport = {
  range: {
    key: "today" | "7d" | "30d" | "month" | "custom";
    startDate: string;
    endDate: string;
  };
  summary: {
    totalVisits: number;
    uniqueVisitors: number;
    newVisitors: number;
    returningVisitors: number;
    bookingStarted: number;
    bookingCompleted: number;
    bookingCancelled: number;
    abandonedBookings: number;
    visitToBookingConversionRate: number;
    bookingCompletionRate: number;
    bookingAbandonmentRate: number;
    cancellationRate: number;
  };
  trends: {
    landingVisitsLast7Days: Array<{ date: string; label: string; count: number; amount?: number }>;
    completedBookings: Array<{ date: string; label: string; count: number; amount: number }>;
    cancelledBookings: Array<{ date: string; label: string; count: number; amount?: number }>;
  };
  charts: {
    pageVisits: Array<{ label: string; count: number }>;
    funnel: Array<{ eventType: AnalyticsEventType; label: string; count: number }>;
    deviceUsage: Array<{ label: string; count: number }>;
    browserUsage: Array<{ label: string; count: number }>;
    topReferrers: Array<{ label: string; count: number }>;
  };
  tables: {
    topVisitedRooms: Array<{ roomId: string; roomName: string; count: number; amount: number }>;
    mostBookedRooms: Array<{ roomId: string; roomName: string; count: number; amount: number }>;
    highViewLowBookingRooms: Array<{
      roomId: string;
      roomName: string;
      views: number;
      bookings: number;
      conversionRate: number;
    }>;
  };
};
