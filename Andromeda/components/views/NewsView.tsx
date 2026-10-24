'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useApi } from '@/lib/client';
import type { Article, NewsResponse } from '@/lib/types-more';
import { ChevronLeft } from '../Icons';
import { Empty, fmtDate, LoadError, PageHead, Skeleton } from '../ui';

function ArticleCard({ a }: { a: Article }) {
  return (
    <Link href={`/aktualnosci/${encodeURIComponent(a.id)}`} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, color: 'var(--ink)', padding: 18 }}>
      {a.image && <img src={a.image} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 14 }} />}
      <span className="meta-line">{[fmtDate(a.date), a.faculty].filter(Boolean).join(' · ')}</span>
      <b style={{ fontSize: 18, lineHeight: 1.3 }}>{a.title}</b>
      {a.headlineHtml && <div className="html" style={{ fontSize: 15, color: 'var(--muted)' }} dangerouslySetInnerHTML={{ __html: a.headlineHtml }} />}
    </Link>
  );
}

export function NewsList() {
  const [start, setStart] = useState(0);
  const api = useApi<NewsResponse>(`/api/aktualnosci?start=${start}`);
  return (
    <>
      <PageHead eyebrow="Ogłoszenia z USOS" title="Aktualności" />
      <LoadError api={api} />
      {api.loading && !api.data ? (
        <Skeleton n={3} h={130} />
      ) : api.data?.articles.length ? (
        <>
          {api.data.articles.map((a) => <ArticleCard key={a.id} a={a} />)}
          <div style={{ display: 'flex', gap: 10 }}>
            {start > 0 && <button className="btn btn-ghost" onClick={() => setStart(Math.max(0, start - 20))}>Nowsze</button>}
            {api.data.nextPage && <button className="btn btn-ghost" onClick={() => setStart(start + 20)}>Starsze</button>}
          </div>
        </>
      ) : (
        api.data && <Empty title="Brak aktualności" />
      )}
    </>
  );
}

export function ArticleView({ id }: { id: string }) {
  const api = useApi<Article>(`/api/aktualnosci/${encodeURIComponent(id)}`);
  const a = api.data;
  return (
    <>
      <Link href="/aktualnosci" className="icon-btn" aria-label="Wróć do aktualności"><ChevronLeft size={20} /></Link>
      <LoadError api={api} />
      {api.loading && !a ? (
        <Skeleton n={2} h={160} />
      ) : a ? (
        <article className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 760 }}>
          <span className="meta-line">{[fmtDate(a.date, true), a.author, a.faculty].filter(Boolean).join(' · ')}</span>
          <h1 className="title" style={{ fontSize: 28 }}>{a.title}</h1>
          {a.image && <img src={a.image} alt="" style={{ width: '100%', borderRadius: 16 }} />}
          {a.headlineHtml && <div className="html" style={{ fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: a.headlineHtml }} />}
          {a.contentHtml && <div className="html" dangerouslySetInnerHTML={{ __html: a.contentHtml }} />}
        </article>
      ) : null}
    </>
  );
}
