import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { CmsPage } from "../../types";
import { publicApi } from "../../lib/api";
import { StaticPageSkeleton } from "../../components/Skeletons";

export function StaticPage() {
  const { key = "terms" } = useParams();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    publicApi
      .cms()
      .then((payload) => {
        setPage(payload.pages[key] || null);
      })
      .finally(() => setLoading(false));
  }, [key]);

  if (loading) return <StaticPageSkeleton />;

  return (
    <main className="page-wrap static-page">
      <section className="page-hero compact">
        <span className="section-kicker">Policy</span>
        <h1>{page?.title || "Content"}</h1>
      </section>
      <article className="policy-card">
        <p>{page?.content || "This page is managed from the admin CMS."}</p>
      </article>
    </main>
  );
}
