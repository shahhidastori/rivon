import { clsx } from "clsx";
import { richTextToHtml } from "../lib/richText";

type RichTextContentProps = {
  value?: string | null;
  fallback?: string;
  className?: string;
};

export function RichTextContent({ value, fallback = "", className }: RichTextContentProps) {
  const html = richTextToHtml(value || fallback);

  if (!html) return null;

  return <div className={clsx("rich-text-content", className)} dangerouslySetInnerHTML={{ __html: html }} />;
}
