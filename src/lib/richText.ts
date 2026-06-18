const ALLOWED_TAGS = new Set([
  "a",
  "blockquote",
  "br",
  "div",
  "em",
  "h2",
  "h3",
  "h4",
  "li",
  "ol",
  "p",
  "s",
  "strong",
  "u",
  "ul"
]);

const INLINE_ALIASES: Record<string, string> = {
  b: "strong",
  i: "em"
};

const SAFE_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function isAllowedHref(href: string) {
  if (href.startsWith("#") || href.startsWith("/")) return true;

  try {
    const url = new URL(href, window.location.origin);
    return SAFE_PROTOCOLS.includes(url.protocol);
  } catch {
    return false;
  }
}

function cleanNode(node: Node, ownerDocument: Document): Node | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return ownerDocument.createTextNode(node.textContent || "");
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as HTMLElement;
  const tagName = INLINE_ALIASES[element.tagName.toLowerCase()] || element.tagName.toLowerCase();

  if (!ALLOWED_TAGS.has(tagName)) {
    const fragment = ownerDocument.createDocumentFragment();
    element.childNodes.forEach((child) => {
      const cleaned = cleanNode(child, ownerDocument);
      if (cleaned) fragment.appendChild(cleaned);
    });
    return fragment;
  }

  const cleanedElement = ownerDocument.createElement(tagName);

  if (tagName === "a") {
    const href = element.getAttribute("href") || "";
    if (href && isAllowedHref(href)) {
      cleanedElement.setAttribute("href", href);
      if (!href.startsWith("#") && !href.startsWith("/")) {
        cleanedElement.setAttribute("target", "_blank");
        cleanedElement.setAttribute("rel", "noreferrer");
      }
    }
  }

  element.childNodes.forEach((child) => {
    const cleaned = cleanNode(child, ownerDocument);
    if (cleaned) cleanedElement.appendChild(cleaned);
  });

  return cleanedElement;
}

export function sanitizeRichText(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";

  if (typeof window === "undefined" || typeof DOMParser === "undefined" || typeof document === "undefined") {
    return escapeHtml(trimmed);
  }

  const parsed = new DOMParser().parseFromString(`<div>${trimmed}</div>`, "text/html");
  const wrapper = document.createElement("div");
  parsed.body.firstElementChild?.childNodes.forEach((child) => {
    const cleaned = cleanNode(child, document);
    if (cleaned) wrapper.appendChild(cleaned);
  });

  return wrapper.innerHTML
    .replace(/<p><br><\/p>/g, "")
    .replace(/<div><br><\/div>/g, "")
    .trim();
}

function plainTextToHtml(value: string) {
  return value
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

export function richTextToHtml(value = "") {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (!/<\/?[a-z][\s\S]*>/i.test(trimmed)) return plainTextToHtml(trimmed);
  return sanitizeRichText(trimmed);
}
