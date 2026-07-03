import type {
  AdminProfile,
  Booking,
  BookingStatus,
  CmsPage,
  CmsPayload,
  CmsSection,
  Customer,
  PaymentMethod,
  PaymentStatus,
  Room
} from "../types";

const TOKEN_KEY = "hotel-admin-token";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

type AdminRoomPayload = Omit<Partial<Room>, "amenities" | "images"> & {
  amenities: string[];
  images: Array<{
    id?: string;
    url: string;
    alt?: string;
    isPrimary?: boolean;
    sortOrder?: number;
  }>;
};

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;

  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(path, {
    ...options,
    headers
  });

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || "Request failed.";
    throw new Error(message);
  }

  return payload as T;
}

export const publicApi = {
  cms: () => apiRequest<CmsPayload>("/api/public/cms"),
  rooms: (query = "") =>
    apiRequest<{ rooms: Room[]; filters: { types: string[] } }>(`/api/public/rooms${query}`),
  room: (slug: string) => apiRequest<{ room: Room }>(`/api/public/rooms/${slug}`),
  uploadReceipt: (file: File) => {
    const form = new FormData();
    form.append("receipt", file);
    return apiRequest<{ url: string; filename: string }>("/api/public/booking-receipts", {
      method: "POST",
      body: form
    });
  },
  createBooking: (body: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    customer: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      country?: string;
    };
    paymentMethod: PaymentMethod;
    specialRequests?: string;
    receiptUrl?: string;
  }) =>
    apiRequest<{ booking: Booking }>("/api/public/bookings", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  lookupBooking: (body: { reference: string; email: string }) =>
    apiRequest<{ booking: Booking }>("/api/public/bookings/lookup", {
      method: "POST",
      body: JSON.stringify(body)
    }),
  cancelBooking: (reference: string, email: string) =>
    apiRequest<{ booking: Booking }>(`/api/public/bookings/${reference}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ email })
    })
};

export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; admin: AdminProfile }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: () => apiRequest<{ admin: AdminProfile }>("/api/auth/me", { auth: true })
};

export const adminApi = {
  dashboard: () =>
    apiRequest<{
      totalBookings: number;
      pendingBookings: number;
      confirmedBookings: number;
      availableRooms: number;
      occupancyRate: number;
      revenue: { paid: number; expected: number };
      recentBookings: Booking[];
    }>("/api/admin/dashboard", { auth: true }),
  rooms: (query = "") => apiRequest<{ rooms: Room[] }>(`/api/admin/rooms${query}`, { auth: true }),
  saveRoom: (room: AdminRoomPayload) =>
    apiRequest<{ room: Room }>(room.id ? `/api/admin/rooms/${room.id}` : "/api/admin/rooms", {
      auth: true,
      method: room.id ? "PATCH" : "POST",
      body: JSON.stringify(room)
    }),
  deleteRoom: (id: string) =>
    apiRequest<{ room?: Room; message?: string } | null>(`/api/admin/rooms/${id}`, {
      auth: true,
      method: "DELETE"
    }),
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("image", file);
    return apiRequest<{ url: string; filename: string }>("/api/admin/uploads", {
      auth: true,
      method: "POST",
      body: form
    });
  },
  bookings: (query = "") => apiRequest<{ bookings: Booking[] }>(`/api/admin/bookings${query}`, { auth: true }),
  createBooking: (body: {
    roomId: string;
    checkIn: string;
    checkOut: string;
    guests: number;
    customer: { firstName: string; lastName: string; email: string; phone: string; country?: string };
    paymentMethod: PaymentMethod;
    status: BookingStatus;
    paymentStatus: PaymentStatus;
    specialRequests?: string;
  }) =>
    apiRequest<{ booking: Booking }>("/api/admin/bookings", {
      auth: true,
      method: "POST",
      body: JSON.stringify(body)
    }),
  updateBooking: (id: string, body: { status?: BookingStatus; paymentStatus?: PaymentStatus }) =>
    apiRequest<{ booking: Booking }>(`/api/admin/bookings/${id}`, {
      auth: true,
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  customers: (query = "") => apiRequest<{ customers: Customer[] }>(`/api/admin/customers${query}`, { auth: true }),
  cms: () => apiRequest<{ sections: CmsSection[]; pages: CmsPage[] }>("/api/admin/cms", { auth: true }),
  saveSection: (key: string, body: Partial<CmsSection>) =>
    apiRequest<{ section: CmsSection }>(`/api/admin/cms/sections/${key}`, {
      auth: true,
      method: "PATCH",
      body: JSON.stringify(body)
    }),
  savePage: (key: string, body: Partial<CmsPage>) =>
    apiRequest<{ page: CmsPage }>(`/api/admin/cms/pages/${key}`, {
      auth: true,
      method: "PATCH",
      body: JSON.stringify(body)
    })
};

export function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  }).format(value).replace(/^/, "PKR ");
}

export function dateLabel(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
}
