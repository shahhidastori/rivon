import { rateLimit } from "express-rate-limit";

function tooManyRequests(message: string) {
  return { message };
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 900,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many requests. Please slow down and try again.")
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many login attempts. Please try again later.")
});

export const adminProfileLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many account update attempts. Please try again later.")
});

export const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many booking requests. Please try again later.")
});

export const analyticsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many analytics events.")
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 24,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: tooManyRequests("Too many upload attempts. Please try again later.")
});
