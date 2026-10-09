"use client";

import { useEffect, useState } from "react";
import { AuthGuard } from "@/app/Components/auth/AuthGuard";
import { SidebarLayout, type SidebarNavItem } from "@/app/Components/auth/SidebarLayout";
import {
  Button,
  Card,
  Input,
  StatusBadge,
} from "@/app/Components/ui";
import {
  canvasApi,
  type ProjectModel,
} from "@/app/lib/client/canvas-api";
import {
  FolderKanban,
  Eye,
  FileImage,
  RefreshCw,
  Search,
  List,
  LayoutGrid,
} from "lucide-react";

export default function ClientDashboardPage() {
  return (
    <AuthGuard requiredRole="user">
      {(user) => <ClientDashboardContent clientUser={user} />}
    </AuthGuard>
  );
}

function ClientDashboardContent({ clientUser }: { clientUser: any }) {
  const [projects, setProjects] = useState<ProjectModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [projectSearch, setProjectSearch] = useState("");
  const [projectListViewMode, setProjectListViewMode] = useState<"card" | "list">("card");

  const backendHost = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const navItems: SidebarNavItem[] = [
    { id: "projects", label: "My Design Proofs", icon: FolderKanban, badge: projects.length },
  ];

  async function loadClientProjects() {
    try {
      const data = await canvasApi.listProjects(projectSearch || undefined);
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadClientProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectSearch]);

  function openReview(p: ProjectModel) {
    if (p.shareToken) {
      window.location.href = `/review/${p.shareToken}`;
    }
  }

  return (
    <SidebarLayout
      title="Client Review Portal"
      subtitle="View, review, and submit feedback on your custom design proofs"
      roleName="Client User"
      userEmail={clientUser.email}
      userName={clientUser.name}
      navItems={navItems}
      activeTab={activeTab}
      onTabChange={setActiveTab}
    >
      {activeTab === "projects" && (
        <div className="space-y-5 max-w-3xl">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <Search
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <Input
                type="text"
                placeholder="Search project..."
                value={projectSearch}
                onChange={(e) => setProjectSearch(e.target.value)}
                className="pl-9 h-10 bg-white shadow-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-0.5 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                <Button
                  variant={projectListViewMode === "card" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("card")}
                  title="Card View"
                  className={projectListViewMode === "card" ? "shadow-sm" : ""}
                >
                  <LayoutGrid size={14} />
                </Button>
                <Button
                  variant={projectListViewMode === "list" ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => setProjectListViewMode("list")}
                  title="List View"
                  className={projectListViewMode === "list" ? "shadow-sm" : ""}
                >
                  <List size={14} />
                </Button>
              </div>

              <Button
                variant="outline"
                disabled={refreshing || loading}
                onClick={() => {
                  setRefreshing(true);
                  loadClientProjects();
                }}
                title="Refresh Projects"
              >
                <RefreshCw
                  size={14}
                  className={refreshing ? "animate-spin text-indigo-600" : ""}
                />
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Proofs list only - click opens review */}
          {loading ? (
            <Card className="p-10 text-center text-xs text-slate-500">
              Loading your project proofs...
            </Card>
          ) : projects.length === 0 ? (
            <Card className="p-12 text-center text-slate-400 space-y-2">
              <FileImage size={40} className="mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">
                No active design projects found.
              </p>
              <p className="text-xs">
                When your designer creates a proof, it will appear here.
              </p>
            </Card>
          ) : projectListViewMode === "list" ? (
            <div className="space-y-2">
              {projects.map((p) => (
                <Card
                  key={p.id}
                  onClick={() => openReview(p)}
                  className={`p-3.5 transition hover:border-indigo-300 hover:shadow-md ${
                    p.shareToken ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{p.name}</h3>
                        <StatusBadge status={p.status} />
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        Designer:{" "}
                        <strong className="text-slate-700">{p.designerName || "Designer"}</strong>
                        {" · "}
                        Updated {new Date(p.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {p.shareToken && (
                      <span className="text-indigo-600 font-bold text-xs flex items-center gap-1 flex-shrink-0">
                        <Eye size={13} /> Open Proof
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {projects.map((p) => {
                const thumb = p.previewThumbnailUrl
                  ? `${backendHost}${p.previewThumbnailUrl}`
                  : null;

                return (
                  <Card
                    key={p.id}
                    onClick={() => openReview(p)}
                    className={`overflow-hidden transition hover:border-indigo-300 hover:shadow-md p-0 ${
                      p.shareToken ? "cursor-pointer" : "opacity-70 cursor-not-allowed"
                    }`}
                  >
                    {/* Small proof preview */}
                    <div className="relative aspect-[16/10] bg-slate-50 border-b border-slate-100">
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={`${p.name} preview`}
                          className="w-full h-full object-contain bg-white"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-1">
                          <FileImage size={28} />
                          <span className="text-[10px] font-medium text-slate-400">No preview yet</span>
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <StatusBadge status={p.status} compact />
                      </div>
                    </div>

                    <div className="p-3.5 space-y-2">
                      <div className="min-w-0">
                        <h3
                          className="font-extrabold text-slate-900 text-sm truncate"
                          title={p.name}
                        >
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Designer:{" "}
                          <strong className="text-slate-700">
                            {p.designerName || "Designer"}
                          </strong>
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-slate-100 pt-2.5">
                        <span className="text-slate-400 text-[11px]">
                          Updated {new Date(p.updatedAt).toLocaleDateString()}
                        </span>
                        {p.shareToken && (
                          <span className="text-indigo-600 font-bold flex items-center gap-1">
                            <Eye size={13} /> Open Proof
                          </span>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </SidebarLayout>
  );
}
