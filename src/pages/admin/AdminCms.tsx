import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import type { CmsPage, CmsSection } from "../../types";
import { adminApi } from "../../lib/api";
import { prepareTransparentLogo } from "../../lib/transparentLogo";
import { Button, Field, TextArea } from "../../components/ui";
import { RichTextEditor } from "../../components/RichTextEditor";
import { announceBrandLogoUpdate, fallbackBrandLogo, versionedBrandLogoUrl } from "../../hooks/useBrandLogo";

export function AdminCms() {
  const [sections, setSections] = useState<CmsSection[]>([]);
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [activeSection, setActiveSection] = useState<CmsSection | null>(null);
  const [activePage, setActivePage] = useState<CmsPage | null>(null);
  const [message, setMessage] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const brandingSection = sections.find((section) => section.key === "branding");

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

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = "";

    if (!file) return;
    if (!["image/png", "image/jpeg"].includes(file.type)) {
      setMessage("Logo upload failed. Please choose a PNG or JPG file.");
      return;
    }

    setLogoUploading(true);
    setMessage("Preparing transparent logo...");

    try {
      const transparentLogo = await prepareTransparentLogo(file);
      const uploaded = await adminApi.uploadImage(transparentLogo);
      const payload = await adminApi.saveSection("branding", {
        title: brandingSection?.title || "Brand Logo",
        subtitle: brandingSection?.subtitle || "Rivon Resort",
        body: brandingSection?.body || "Logo used across public and admin brand areas.",
        imageUrl: uploaded.url,
        metadataJson: brandingSection?.metadataJson || JSON.stringify({ alt: "Hotel logo" })
      });

      setSections((current) => {
        const remainingSections = current.filter((section) => section.key !== "branding");
        return [...remainingSections, payload.section].sort((a, b) => a.key.localeCompare(b.key));
      });
      setActiveSection(payload.section);
      announceBrandLogoUpdate(versionedBrandLogoUrl(payload.section.imageUrl, payload.section.updatedAt, fallbackBrandLogo));
      setMessage("Logo uploaded and applied across the website.");
    } catch (err) {
      setMessage(err instanceof Error ? `Logo upload failed. ${err.message}` : "Logo upload failed.");
    } finally {
      setLogoUploading(false);
    }
  }

  const isErrorMessage = message.toLowerCase().includes("failed");

  return (
    <section className="admin-page cms-admin">
      <div className="admin-heading">
        <span>Website</span>
        <h1>CMS Management</h1>
      </div>
      {message ? <div className={isErrorMessage ? "alert error" : "alert success"}>{message}</div> : null}

      <div className="admin-card logo-upload-card">
        <div>
          <span className="admin-eyebrow">Branding</span>
          <h2>Website Logo</h2>
          <p>Upload a PNG or JPG logo to use across the landing page, header, footer, admin sidebar, and login screen.</p>
        </div>
        <img
          className="logo-upload-preview"
          src={versionedBrandLogoUrl(brandingSection?.imageUrl, brandingSection?.updatedAt, fallbackBrandLogo)}
          alt="Current website logo preview"
        />
        <label className={logoUploading ? "upload-line disabled" : "upload-line"}>
          {logoUploading ? "Uploading logo..." : "Upload PNG/JPG logo"}
          <input type="file" accept="image/png,image/jpeg" onChange={uploadLogo} disabled={logoUploading} />
        </label>
      </div>

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
              <RichTextEditor label="Body" value={activeSection.body || ""} onChange={(body) => setActiveSection({ ...activeSection, body })} />
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
              <RichTextEditor label="Content" value={activePage.content} onChange={(content) => setActivePage({ ...activePage, content })} />
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
