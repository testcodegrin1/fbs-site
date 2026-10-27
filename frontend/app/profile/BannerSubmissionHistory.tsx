"use client";
/* eslint-disable @next/next/no-img-element -- submission images are uploaded at runtime to the configured API host */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle, Download, Eye, FileImage, LogOut, MessageSquare, RefreshCw, Search, Send, X } from "lucide-react";
import type { AuthUser } from "@/app/lib/auth/types";
import { authApi } from "@/app/lib/client/auth-api";
import {
  bannerTemplateApi,
  resolveImageUrl,
  type BannerSubmissionDetail,
  type BannerSubmissionListItem,
  type BannerSubmissionThread,
} from "@/app/lib/client/banner-template-api";

function statusClass(status: string) {
  switch (status.toLowerCase().replaceAll("_", " ")) {
    case "approved": return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "completed": return "border-purple-200 bg-purple-50 text-purple-700";
    case "rejected": return "border-red-200 bg-red-50 text-red-700";
    case "changes requested": return "border-orange-200 bg-orange-50 text-orange-700";
    case "in review": return "border-blue-200 bg-blue-50 text-blue-700";
    default: return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function Status({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(value)}`}>{value || "Pending"}</span>;
}

export function BannerSubmissionHistory({ user }: { user: AuthUser }) {
  const [submissions, setSubmissions] = useState<BannerSubmissionListItem[]>([]);
  const [selected, setSelected] = useState<BannerSubmissionDetail | null>(null);
  const [thread, setThread] = useState<BannerSubmissionThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [signingOut, setSigningOut] = useState(false);
  const [reply, setReply] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    bannerTemplateApi.getMyBannerSubmissions()
      .then(result => { if (active) setSubmissions(result.submissions); })
      .catch(loadError => { if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load banner submissions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshKey]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return submissions;
    return submissions.filter(item => `${item.templateName} ${item.status} ${item.franchiseName || ""} ${item.id}`.toLowerCase().includes(query));
  }, [search, submissions]);

  async function openSubmission(id: number) {
    setDetailLoading(true);
    setError("");
    try {
      const reviewThread = await bannerTemplateApi.getBannerSubmissionThread(id);
      if (!reviewThread?.submission) throw new Error("Banner submission was not found.");
      setThread(reviewThread);
      setSelected(reviewThread.submission);
    } catch (detailError) {
      setError(detailError instanceof Error ? detailError.message : "Unable to load submission details.");
    } finally {
      setDetailLoading(false);
    }
  }

  async function sendReview(statusAction?: "approved" | "changes_requested") {
    if (!selected || sendingReply) return;
    const message = reply.trim() || (statusAction === "approved" ? "Approved" : statusAction === "changes_requested" ? "Changes requested" : "");
    if (!message) return;
    setSendingReply(true);
    setError("");
    try {
      await bannerTemplateApi.sendBannerSubmissionMessage(selected.id, message, null, statusAction);
      const updatedThread = await bannerTemplateApi.getBannerSubmissionThread(selected.id);
      setThread(updatedThread);
      setSelected(updatedThread.submission);
      setReply("");
      setSubmissions(current => current.map(item => item.id === selected.id ? { ...item, status: updatedThread.submission.status, updatedAt: updatedThread.submission.updatedAt } : item));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to send your review.");
    } finally {
      setSendingReply(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try { await authApi.logout(); }
    finally { window.location.assign("/"); }
  }

  return <main className="mt-24 min-h-[65vh] bg-slate-50 xl:mt-20">
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Signed in as {user.name}</p>
          <h1 className="mt-1 text-2xl font-bold text-primary-dark md:text-3xl">Banner submissions</h1>
          <p className="mt-1 text-sm text-primary-dark/65">Review your banner orders, proofs, and current status.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/printing-products" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white">Browse products</Link>
          <button type="button" onClick={() => void signOut()} disabled={signingOut} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"><LogOut size={15} />{signingOut ? "Signing out..." : "Sign out"}</button>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-6xl px-5 py-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1"><span className="sr-only">Search submissions</span><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search banner submissions..." className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /></label>
        <button type="button" onClick={() => setRefreshKey(value => value + 1)} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-60"><RefreshCw size={15} className={loading ? "animate-spin" : ""} />Refresh</button>
      </div>

      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div>}
      {loading ? <div role="status" className="rounded-2xl bg-white p-12 text-center text-slate-500 shadow-sm">Loading banner submissions...</div>
      : filtered.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center shadow-sm"><FileImage size={40} className="mx-auto text-slate-300" /><h2 className="mt-4 text-lg font-semibold text-slate-800">No banner submissions found</h2><p className="mt-2 text-slate-500">{search ? "No submission matches your search." : "Your banner requests will appear here after submission."}</p><Link href="/printing-products" className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 font-semibold text-white">Browse printing products</Link></div>
      : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{filtered.map(item => <button key={item.id} type="button" onClick={() => void openSubmission(item.id)} className="overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
        <div className="flex aspect-[16/8] items-center justify-center bg-slate-100">{item.previewImageUrl ? <img src={resolveImageUrl(item.previewImageUrl)} alt={`${item.templateName} preview`} className="h-full w-full object-contain" /> : <FileImage size={30} className="text-slate-300" />}</div>
        <div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h2 className="truncate text-sm font-semibold text-slate-900">{item.templateName}</h2><Status value={item.status} /></div><p className="text-xs text-slate-500">#{item.id} · Qty {item.quantity || 1} · {new Date(item.createdAt).toLocaleDateString()}</p><span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"><Eye size={14} />Open review</span></div>
      </button>)}</div>}
      {detailLoading && <div role="status" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 text-white">Loading submission...</div>}
    </section>

    {selected && <div role="dialog" aria-modal="true" aria-label={`Submission ${selected.id}`} className="fixed inset-0 z-[70] overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm" onClick={event => { if (event.target === event.currentTarget) { setSelected(null); setThread(null); } }}>
      <div className="mx-auto my-5 w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5"><div><div className="flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold text-slate-900">{selected.templateName}</h2><Status value={selected.status} /></div><p className="mt-1 text-sm text-slate-500">Order #{selected.id} · Quantity {selected.quantity || 1}</p></div><button type="button" onClick={() => { setSelected(null); setThread(null); setReply(""); }} aria-label="Close submission details" className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X /></button></header>
        {error && <div role="alert" className="mx-5 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
        <div className="grid gap-6 p-5 md:grid-cols-[1.1fr_0.9fr] md:p-6">
          <div className="space-y-5">
          {selected.previewImageUrl && <div className="flex max-h-96 items-center justify-center overflow-hidden rounded-xl bg-slate-100 p-4"><img src={resolveImageUrl(selected.previewImageUrl)} alt={selected.templateName} className="max-h-80 max-w-full object-contain" /></div>}
          <section><h3 className="mb-3 font-semibold text-slate-900">Submitted information</h3>{selected.submittedFields?.length ? <dl className="grid gap-3 sm:grid-cols-2">{selected.submittedFields.map((field, index) => <div key={`${field.id}-${index}`} className={`rounded-xl border border-slate-200 bg-slate-50 p-4 ${field.fieldType === "textarea" ? "sm:col-span-2" : ""}`}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field.label}</dt><dd className="mt-1 break-words text-slate-900">{field.fieldType === "file" && typeof field.value === "string" ? <a href={resolveImageUrl(field.value)} target="_blank" rel="noreferrer" className="font-semibold text-primary underline">View uploaded file</a> : String(field.value ?? "-")}</dd></div>)}</dl> : <p className="text-slate-500">No additional information was submitted.</p>}</section>
          <div className="grid gap-3 border-t border-slate-200 pt-5 text-sm text-slate-600 sm:grid-cols-2"><p><strong>Submitted:</strong> {new Date(selected.createdAt).toLocaleString()}</p><p><strong>Last updated:</strong> {new Date(selected.updatedAt).toLocaleString()}</p></div>
          </div>

          <aside className="space-y-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <section><h3 className="flex items-center gap-2 font-semibold text-slate-900"><FileImage size={17} />Review proofs</h3><div className="mt-3 space-y-3">{thread?.files?.length ? thread.files.filter(file => !file.isReplaced).map(file => <div key={file.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white"><a href={resolveImageUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="block">{/\.(png|jpe?g|webp|gif|svg)$/i.test(file.fileUrl) ? <img src={resolveImageUrl(file.fileUrl)} alt={file.fileName || "Banner proof"} className="max-h-48 w-full object-contain bg-slate-100" /> : <div className="flex items-center gap-2 p-4 text-primary"><FileImage />{file.fileName || "Review file"}</div>}</a><div className="flex items-center justify-between gap-3 border-t border-slate-100 p-3 text-xs text-slate-500"><span>Version {file.version}</span><a href={resolveImageUrl(file.fileUrl)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-primary"><Download size={13} />Open</a></div></div>) : <p className="rounded-lg bg-white p-4 text-sm text-slate-500">No review proof has been uploaded yet.</p>}</div></section>

            <section className="border-t border-slate-200 pt-4"><h3 className="flex items-center gap-2 font-semibold text-slate-900"><MessageSquare size={17} />Review messages</h3><div className="mt-3 max-h-52 space-y-2 overflow-y-auto">{thread?.messages?.length ? thread.messages.map(message => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.senderRole === "user" ? "ml-5 bg-primary text-white" : "mr-5 border border-slate-200 bg-white text-slate-700"}`}><div className="mb-1 flex justify-between gap-2 text-xs opacity-75"><strong>{message.senderName || message.senderRole}</strong><span>{new Date(message.createdAt).toLocaleDateString()}</span></div><p className="whitespace-pre-wrap break-words">{message.message}</p></div>) : <p className="rounded-lg bg-white p-4 text-sm text-slate-500">No review messages yet.</p>}</div></section>

            <section className="border-t border-slate-200 pt-4"><label htmlFor="review-reply" className="text-sm font-semibold text-slate-900">Your review or reply</label><textarea id="review-reply" rows={3} maxLength={5000} value={reply} onChange={event => setReply(event.target.value)} disabled={sendingReply} placeholder="Write a message about this banner proof..." className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => void sendReview()} disabled={sendingReply || !reply.trim()} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Send size={14} />Send reply</button><button type="button" onClick={() => void sendReview("approved")} disabled={sendingReply} className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><CheckCircle size={14} />Approve</button><button type="button" onClick={() => void sendReview("changes_requested")} disabled={sendingReply || !reply.trim()} className="rounded-full border border-orange-300 bg-white px-4 py-2 text-sm font-semibold text-orange-700 disabled:opacity-50">Request changes</button></div></section>
          </aside>
        </div>
      </div>
    </div>}
  </main>;
}
