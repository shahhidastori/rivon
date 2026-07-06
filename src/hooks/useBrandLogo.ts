import { useEffect, useState } from "react";
import { publicApi } from "../lib/api";
import fallbackBrandLogo from "../assets/brand-logo-transparent.png";

export { fallbackBrandLogo };

const BRAND_LOGO_UPDATED_EVENT = "rivon:brand-logo-updated";
const BRAND_LOGO_STORAGE_KEY = "rivon:brand-logo-url";

export function versionedBrandLogoUrl(logoUrl?: string | null, updatedAt?: string | null, initialLogo = fallbackBrandLogo) {
  if (!logoUrl) return initialLogo;
  if (!updatedAt || !logoUrl.startsWith("/uploads/")) return logoUrl;

  const separator = logoUrl.includes("?") ? "&" : "?";
  return `${logoUrl}${separator}v=${encodeURIComponent(updatedAt)}`;
}

export function announceBrandLogoUpdate(logoUrl: string) {
  try {
    localStorage.setItem(BRAND_LOGO_STORAGE_KEY, logoUrl);
  } catch {
    // Storage can be unavailable in restricted browser modes.
  }

  window.dispatchEvent(new CustomEvent(BRAND_LOGO_UPDATED_EVENT, { detail: logoUrl }));
}

function readStoredBrandLogo(initialLogo: string) {
  try {
    return localStorage.getItem(BRAND_LOGO_STORAGE_KEY) || initialLogo;
  } catch {
    return initialLogo;
  }
}

async function resolveBrandLogoUrl(logoUrl: string, fallbackLogo: string) {
  if (!logoUrl.startsWith("/uploads/")) return logoUrl;

  try {
    const response = await fetch(logoUrl, { cache: "no-store" });
    if (response.ok && response.headers.get("content-type")?.startsWith("image/")) {
      return logoUrl;
    }
  } catch {
    // Fall back to the bundled logo when uploaded assets are unavailable.
  }

  return fallbackLogo;
}

export function useBrandLogo(initialLogo = fallbackBrandLogo) {
  const [logoUrl, setLogoUrl] = useState(() => readStoredBrandLogo(initialLogo));

  useEffect(() => {
    let cancelled = false;
    const handleLogoUpdate = (event: Event) => {
      const nextLogoUrl = (event as CustomEvent<string>).detail;
      setLogoUrl(nextLogoUrl || initialLogo);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === BRAND_LOGO_STORAGE_KEY) {
        setLogoUrl(event.newValue || initialLogo);
      }
    };

    publicApi
      .cms()
      .then(async (payload) => {
        if (cancelled) return;

        const branding = payload.sections.branding;
        const cmsLogoUrl = versionedBrandLogoUrl(branding?.imageUrl, branding?.updatedAt, initialLogo);
        const nextLogoUrl = await resolveBrandLogoUrl(cmsLogoUrl, initialLogo);
        if (cancelled) return;

        setLogoUrl(nextLogoUrl);
        try {
          localStorage.setItem(BRAND_LOGO_STORAGE_KEY, nextLogoUrl);
        } catch {
          // Storage can be unavailable in restricted browser modes.
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogoUrl(initialLogo);
        }
      });

    window.addEventListener(BRAND_LOGO_UPDATED_EVENT, handleLogoUpdate);
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(BRAND_LOGO_UPDATED_EVENT, handleLogoUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, [initialLogo]);

  return logoUrl;
}
