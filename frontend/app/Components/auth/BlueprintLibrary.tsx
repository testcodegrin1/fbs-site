"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit, Eye, Layers, Loader2, Plus, Trash2, X } from "lucide-react";
import type { DiagramTemplateModel } from "@/app/lib/client/canvas-api";
import { resolveImageUrl } from "@/app/lib/client/product-template-api";
import { Button, Card } from "@/app/Components/ui";
import { DetailRow } from "@/app/Components/ui/detail-row";

type BlueprintLibraryProps = {
  diagrams: DiagramTemplateModel[];
  deletingId: number | null;
  onCreate: () => void;
  onEdit: (diagram: DiagramTemplateModel) => void;
  onDelete: (diagram: DiagramTemplateModel) => void;
  onPreview: (preview: { url: string; name: string; version: number }) => void;
};

function BlueprintPreview({ src, name, large = false }: { src: string; name: string; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`flex items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-slate-50 text-slate-400 ${large ? "min-h-48 w-full" : "h-10 w-12"}`}>
      {src && !failed ? (
        <Image src={src} alt={name} width={large ? 960 : 48} height={large ? 600 : 40} unoptimized onError={() => setFailed(true)} className={large ? "max-h-[45dvh] w-full object-contain" : "h-full w-full object-contain"} />
      ) : (
        <div className="flex flex-col items-center gap-2 p-2">
          <Layers size={large ? 32 : 18} aria-hidden="true" />
          {large && <span className="text-xs">Preview unavailable</span>}
        </div>
      )}
    </div>
  );
}

/** Shared directory presentation; all mutations remain in the parent dashboard. */
export function BlueprintLibrary({ diagrams, deletingId, onCreate, onEdit, onDelete, onPreview }: BlueprintLibraryProps) {
  const [selected, setSelected] = useState<DiagramTemplateModel | null>(null);
  const previewUrl = resolveImageUrl(selected?.previewUrl);

  return (
    <>
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-6">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Diagram Blueprints</h2>
            <p className="mt-1 text-xs text-slate-500">Manage technical blueprint templates and diagram layouts with photos.</p>
          </div>
          <Button size="sm" onClick={onCreate}><Plus size={15} /> Add Blueprint</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] text-left">
            <thead>
              <tr><th>Preview</th><th>Name</th><th>Description</th><th>Updated</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {diagrams.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">No diagram blueprints yet. Add a blueprint to get started.</td></tr>
              ) : diagrams.map((diagram) => {
                const src = resolveImageUrl(diagram.previewUrl);
                return (
                  <DetailRow key={diagram.id} onClick={() => setSelected(diagram)} aria-label={`View ${diagram.name} details`}>
                    <td className="w-24"><BlueprintPreview key={src} src={src} name={diagram.name} /></td>
                    <td className="font-medium text-slate-900">{diagram.name}</td>
                    <td className="max-w-xs text-slate-500"><p className="truncate">{diagram.description || "—"}</p></td>
                    <td className="whitespace-nowrap text-xs text-slate-500">{new Date(diagram.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon-sm" className="portal-action" title="View blueprint" aria-label={`View ${diagram.name}`} onClick={() => setSelected(diagram)}><Eye size={15} /></Button>
                        <Button variant="outline" size="icon-sm" className="portal-action" title="Edit blueprint" aria-label={`Edit ${diagram.name}`} onClick={() => onEdit(diagram)}><Edit size={15} /></Button>
                        <Button variant="outline" size="icon-sm" className="portal-action portal-action-danger" title={deletingId === diagram.id ? "Deleting blueprint" : "Delete blueprint"} aria-label={`Delete ${diagram.name}`} disabled={deletingId === diagram.id} onClick={() => onDelete(diagram)}>
                          {deletingId === diagram.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                        </Button>
                      </div>
                    </td>
                  </DetailRow>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && (
        <dialog ref={(dialog) => { if (dialog && !dialog.open) dialog.showModal(); }} aria-labelledby="blueprint-details-title" onCancel={() => setSelected(null)} className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 text-slate-900 shadow-xl backdrop:bg-slate-950/40">
          <div className="mb-5 flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h2 id="blueprint-details-title" className="text-lg font-semibold">{selected.name}</h2>
            <Button variant="ghost" size="icon-sm" title="Close blueprint details" onClick={() => setSelected(null)}><X size={18} /></Button>
          </div>
          <BlueprintPreview key={previewUrl} src={previewUrl} name={selected.name} large />
          <dl className="grid grid-cols-[90px_minmax(0,1fr)] gap-4 py-5 text-sm [&>dt]:text-slate-500 [&>dd]:break-words">
            <dt>Description</dt><dd className="whitespace-pre-wrap">{selected.description || "—"}</dd>
            <dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd>
            <dt>Updated</dt><dd>{new Date(selected.updatedAt).toLocaleString()}</dd>
          </dl>
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {previewUrl && <Button variant="outline" size="sm" onClick={() => { onPreview({ url: previewUrl, name: selected.name, version: 1 }); setSelected(null); }}><Eye size={15} /> Fullscreen</Button>}
            <Button variant="outline" size="sm" onClick={() => { onEdit(selected); setSelected(null); }}><Edit size={15} /> Edit Blueprint</Button>
          </div>
        </dialog>
      )}
    </>
  );
}
