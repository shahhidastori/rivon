import { useEffect, useState } from "react";
import { publicApi } from "../lib/api";
import fallbackBrandLogo from "../assets/brand-logo-transparent.png";

export { fallbackBrandLogo };

const BRAND_LOGO_UPDATED_EVENT = "rivon:brand-logo-updated";

export function announceBrandLogoUpdate(logoUrl: string) {
  window.dispatchEvent(new CustomEvent(BRAND_LOGO_UPDATED_EVENT, { detail: logoUrl }));
}

export function useBrandLogo(initialLogo = fallbackBrandLogo) {
  const [logoUrl, setLogoUrl] = useState(initialLogo);

  useEffect(() => {
    let cancelled = false;
    const handleLogoUpdate = (event: Event) => {
      const nextLogoUrl = (event as CustomEvent<string>).detail;
      setLogoUrl(nextLogoUrl || initialLogo);
    };

    publicApi
      .cms()
      .then((payload) => {
        if (!cancelled) {
          setLogoUrl(payload.sections.branding?.imageUrl || initialLogo);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLogoUrl(initialLogo);
        }
      });

    window.addEventListener(BRAND_LOGO_UPDATED_EVENT, handleLogoUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(BRAND_LOGO_UPDATED_EVENT, handleLogoUpdate);
    };
  }, [initialLogo]);

  return logoUrl;
}
