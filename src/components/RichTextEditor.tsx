import { useEffect, useRef } from "react";
import { Bold, Eraser, Heading2, Heading3, Italic, Link, List, ListOrdered, Pilcrow, Underline } from "lucide-react";
import { sanitizeRichText } from "../lib/richText";

type RichTextEditorProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

type ToolbarButton = {
  label: string;
  icon: typeof Bold;
  command: () => void;
};

function insertHtml(html: string) {
  document.execCommand("insertHTML", false, html);
}

function escapeEditorText(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function RichTextEditor({ label, value, onChange }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  const emitChange = () => {
    const editor = editorRef.current;
    if (!editor) return;
    onChange(sanitizeRichText(editor.innerHTML));
  };

  const runCommand = (command: string, argument?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, argument);
    emitChange();
  };

  const createLink = () => {
    const href = window.prompt("Enter link URL");
    if (!href) return;
    runCommand("createLink", href.trim());
  };

  const buttons: ToolbarButton[] = [
    { label: "Paragraph", icon: Pilcrow, command: () => runCommand("formatBlock", "p") },
    { label: "Heading 2", icon: Heading2, command: () => runCommand("formatBlock", "h2") },
    { label: "Heading 3", icon: Heading3, command: () => runCommand("formatBlock", "h3") },
    { label: "Bold", icon: Bold, command: () => runCommand("bold") },
    { label: "Italic", icon: Italic, command: () => runCommand("italic") },
    { label: "Underline", icon: Underline, command: () => runCommand("underline") },
    { label: "Bulleted list", icon: List, command: () => runCommand("insertUnorderedList") },
    { label: "Numbered list", icon: ListOrdered, command: () => runCommand("insertOrderedList") },
    { label: "Link", icon: Link, command: createLink },
    { label: "Clear formatting", icon: Eraser, command: () => runCommand("removeFormat") }
  ];

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const sanitizedValue = sanitizeRichText(value);
    if (editor.innerHTML !== sanitizedValue) {
      editor.innerHTML = sanitizedValue;
    }
  }, [value]);

  return (
    <div className="field rich-text-field">
      <span>{label}</span>
      <div className="rich-text-editor">
        <div className="rich-text-toolbar" aria-label={`${label} formatting toolbar`}>
          {buttons.map(({ label: buttonLabel, icon: Icon, command }) => (
            <button type="button" key={buttonLabel} onClick={command} aria-label={buttonLabel} title={buttonLabel}>
              <Icon size={16} />
            </button>
          ))}
        </div>
        <div
          ref={editorRef}
          className="rich-text-surface"
          contentEditable
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          onInput={emitChange}
          onBlur={emitChange}
          onPaste={(event) => {
            event.preventDefault();
            const html = event.clipboardData.getData("text/html");
            const text = event.clipboardData.getData("text/plain");
            insertHtml(html ? sanitizeRichText(html) : escapeEditorText(text).replace(/\n/g, "<br>"));
            emitChange();
          }}
          suppressContentEditableWarning
        />
      </div>
    </div>
  );
}
