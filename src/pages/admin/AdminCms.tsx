import { FormEvent, useEffect, useState } from "react";
import type { CmsPage, CmsSection } from "../../types";
import { adminApi } from "../../lib/api";
import { Button, Field, TextArea } from "../../components/ui";

export function AdminCms() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [activeSection, setActiveSection] = useState<CmsSection | null>(null);
  const [activePage, setActivePage] = useState<CmsPage | null>(null);
  const [message, setMessage] = useState("");

  function load() {
    adminApi.cms().then((payload) => {
      setSections(payload.sections);
      setPages(payload.pages);
      setActiveSection(payload.sections[0] || null);
      setActivePage(payload.pages[0] || null);
    });
  }

  useEffect(load, []);

  async function saveSection(event: FormEvent) {
    event.preventDefault();
    if (!activeSection) return;
    try {
      const payload = await adminApi.saveSection(activeSection.key, activeSection);
      setActiveSection(payload.section);
      setMessage("Section updated.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Section update failed.");
    }
  }

  async function savePage(event: FormEvent) {
    event.preventDefault();
    if (!activePage) return;
    try {
      const payload = await adminApi.savePage(activePage.key, activePage);
      setActivePage(payload.page);
      setMessage("Page updated.");
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Page update failed.");
    }
  }

  return (
    <section className="admin-page cms-admin">
      <div className="admin-heading">
        <span>Website</span>
        <h1>CMS Management</h1>
      </div>
      {message ? <div className={message.includes("failed") ? "alert error" : "alert success"}>{message}</div> : null}

      <div className="cms-layout">
        <aside className="admin-card cms-list">
          <h2>Sections</h2>
          {sections.map((section) => (
            <button key={section.key} className={activeSection?.key === section.key ? "active" : ""} onClick={() => setActiveSection(section)}>
              {section.key}
            </button>
          ))}
          <h2>Pages</h2>
          {pages.map((page) => (
            <button key={page.key} className={activePage?.key === page.key ? "active" : ""} onClick={() => setActivePage(page)}>
              {page.key}
            </button>
          ))}
        </aside>

        <form className="admin-card admin-form" onSubmit={saveSection}>
          <h2>Edit Section</h2>
          {activeSection ? (
            <>
              <Field label="Key" value={activeSection.key} disabled />
              <Field label="Title" value={activeSection.title} onChange={(event) => setActiveSection({ ...activeSection, title: event.target.value })} />
              <Field
                label="Subtitle"
                value={activeSection.subtitle || ""}
                onChange={(event) => setActiveSection({ ...activeSection, subtitle: event.target.value })}
              />
              <Field
                label="Image URL"
                value={activeSection.imageUrl || ""}
                onChange={(event) => setActiveSection({ ...activeSection, imageUrl: event.target.value })}
              />
              <TextArea label="Body" value={activeSection.body || ""} onChange={(event) => setActiveSection({ ...activeSection, body: event.target.value })} />
              <TextArea
                label="Metadata JSON"
                value={activeSection.metadataJson || ""}
                onChange={(event) => setActiveSection({ ...activeSection, metadataJson: event.target.value })}
              />
              <Button>Save Section</Button>
            </>
          ) : null}
        </form>

        <form className="admin-card admin-form" onSubmit={savePage}>
          <h2>Edit Page</h2>
          {activePage ? (
            <>
              <Field label="Key" value={activePage.key} disabled />
              <Field label="Title" value={activePage.title} onChange={(event) => setActivePage({ ...activePage, title: event.target.value })} />
              <TextArea label="Content" value={activePage.content} onChange={(event) => setActivePage({ ...activePage, content: event.target.value })} />
              <TextArea
                label="Metadata JSON"
                value={activePage.metadataJson || ""}
                onChange={(event) => setActivePage({ ...activePage, metadataJson: event.target.value })}
              />
              <Button>Save Page</Button>
            </>
          ) : null}
        </form>
      </div>
    </section>
  );
}
