"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  RefreshCw,
  Check,
  UserRoundX,
  UserRoundCheck,
  Calendar,
  Mail,
  Eye,
  X,
  Loader2,
  AlertCircle,
  FileText,
  UserCheck,
} from "lucide-react";
import type { AuthUser } from "@/app/lib/auth/types";
import { authApi } from "@/app/lib/client/auth-api";
import { Button, Card, Input, Badge } from "@/app/Components/ui";

type CustomerWithMeta = AuthUser & {
  submissionsCount?: number;
};

export function CustomerManagement() {
  const [customers, setCustomers] = useState<CustomerWithMeta[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerWithMeta | null>(null);
  const [isTogglingId, setIsTogglingId] = useState<number | null>(null);

  async function loadCustomers(showRefreshState = false) {
    if (showRefreshState) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const res = await authApi.listCustomers(search);
      setCustomers(res.customers || []);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
      setError(err?.message || "Failed to load customers. Please check backend connection.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    // Debounce search by 300ms
    const timer = setTimeout(() => {
      loadCustomers(false);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Client-side status filter
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter === "active") return c.isActive;
      if (statusFilter === "inactive") return !c.isActive;
      return true;
    });
  }, [customers, statusFilter]);

  // Customer statistics
  const stats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.isActive).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [customers]);

  // Toggle active/inactive status
  async function handleToggleStatus(customer: CustomerWithMeta) {
    setIsTogglingId(customer.id);
    try {
      const newStatus = !customer.isActive;
      await authApi.updateUser(customer.id, { isActive: newStatus });
      setCustomers((prev) =>
        prev.map((c) => (c.id === customer.id ? { ...c, isActive: newStatus } : c)),
      );
      if (selectedCustomer?.id === customer.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isActive: newStatus } : null));
      }
    } catch (err: any) {
      alert(err?.message || "Failed to update customer status.");
    } finally {
      setIsTogglingId(null);
    }
  }

  function formatDate(isoString?: string) {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getInitials(name: string) {
    if (!name) return "C";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  return (
    <div className="space-y-6">
      {/* TOOLBAR */}
      <Card className="p-4 bg-white shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* SEARCH INPUT */}
          <div className="relative flex-1 min-w-0">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <Input
              type="text"
              placeholder="Search customer by name or email address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9.5 pr-8 h-10 w-full bg-slate-50 border-slate-200 focus:bg-white text-sm"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* STATUS FILTERS & REFRESH BUTTON */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="inline-flex rounded-lg bg-slate-100 p-1 border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "all"
                    ? "bg-white text-slate-900 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "active"
                    ? "bg-white text-emerald-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({stats.active})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter("inactive")}
                className={`px-3 py-1.5 rounded-md transition ${
                  statusFilter === "inactive"
                    ? "bg-white text-amber-700 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Inactive ({stats.inactive})
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => loadCustomers(true)}
              disabled={isRefreshing || isLoading}
              className="h-9 px-3 gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50"
              title="Refresh customer list"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin text-indigo-600" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* ERROR MESSAGE */}
      {error && (
        <Card className="p-4 bg-red-50 border-red-200 text-red-800 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => loadCustomers(true)} className="text-red-700 hover:bg-red-100">
            Retry
          </Button>
        </Card>
      )}

      {/* CUSTOMERS DATA TABLE */}
      <Card className="overflow-hidden border border-slate-200 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Registered On</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-center">Submissions</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 size={28} className="animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Loading customers from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <Users size={24} />
                      </div>
                      <h4 className="font-bold text-slate-700 text-base">No Customers Found</h4>
                      <p className="text-xs text-slate-500">
                        {search
                          ? `No customer matches the query "${search}". Try searching for another name or email.`
                          : "No registered customers have been found in the database yet."}
                      </p>
                      {search && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSearch("")}
                          className="mt-2 text-xs"
                        >
                          Clear Search
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const isToggling = isTogglingId === customer.id;
                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      {/* NAME & AVATAR */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-xs flex items-center justify-center shadow-xs flex-shrink-0">
                            {getInitials(customer.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition truncate">
                              {customer.name}
                            </p>
                            <span className="text-[11px] font-mono text-slate-400">ID #{customer.id}</span>
                          </div>
                        </div>
                      </td>

                      {/* EMAIL */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-700 font-medium select-all">{customer.email}</span>
                      </td>

                      {/* REGISTERED DATE */}
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                          <span>{formatDate(customer.createdAt)}</span>
                        </div>
                      </td>

                      {/* ACCOUNT STATUS */}
                      <td className="py-3.5 px-4">
                        {customer.isActive ? (
                          <Badge variant="success" className="flex items-center gap-1 w-fit shadow-2xs font-semibold">
                            <Check size={12} /> Active
                          </Badge>
                        ) : (
                          <Badge variant="warning" className="flex items-center gap-1 w-fit shadow-2xs font-semibold">
                            <UserRoundX size={12} /> Inactive
                          </Badge>
                        )}
                      </td>

                      {/* SUBMISSIONS */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                          {customer.submissionsCount ?? 0}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Active / Inactive */}
                          <Button
                            variant={customer.isActive ? "outline" : "default"}
                            size="sm"
                            disabled={isToggling}
                            onClick={() => handleToggleStatus(customer)}
                            className={`h-8 text-xs font-semibold gap-1 ${
                              customer.isActive
                                ? "border-amber-200 text-amber-700 hover:bg-amber-50"
                                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs"
                            }`}
                            title={customer.isActive ? "Deactivate Customer Account" : "Activate Customer Account"}
                          >
                            {isToggling ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : customer.isActive ? (
                              <>
                                <UserRoundX size={13} /> Deactivate
                              </>
                            ) : (
                              <>
                                <UserRoundCheck size={13} /> Activate
                              </>
                            )}
                          </Button>

                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setSelectedCustomer(customer)}
                            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="View Customer Details"
                          >
                            <Eye size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* TABLE FOOTER */}
        {!isLoading && filteredCustomers.length > 0 && (
          <div className="py-3 px-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> of{" "}
              <strong className="text-slate-800">{customers.length}</strong> customers
            </span>
            <span className="text-[11px] text-slate-400">Excludes Super Admin & Designer Staff accounts</span>
          </div>
        )}
      </Card>

      {/* CUSTOMER DETAIL MODAL */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                  {getInitials(selectedCustomer.name)}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-tight">{selectedCustomer.name}</h3>
                  <span className="text-xs text-slate-500">Customer Account #{selectedCustomer.id}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </Button>
            </div>

            {/* DETAILS GRID */}
            <div className="space-y-3.5 text-sm">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Email Address:</span>
                  <span className="font-bold text-slate-900 select-all">{selectedCustomer.email}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="text-xs font-semibold text-slate-500">Account Status:</span>
                  {selectedCustomer.isActive ? (
                    <Badge variant="success" className="flex items-center gap-1 font-semibold">
                      <Check size={12} /> Active Account
                    </Badge>
                  ) : (
                    <Badge variant="warning" className="flex items-center gap-1 font-semibold">
                      <UserRoundX size={12} /> Pending / Inactive
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="text-xs font-semibold text-slate-500">Registration Date:</span>
                  <span className="font-medium text-slate-700 text-xs">{formatDate(selectedCustomer.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="text-xs font-semibold text-slate-500">Last Profile Update:</span>
                  <span className="font-medium text-slate-700 text-xs">{formatDate(selectedCustomer.updatedAt)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200/60 pt-2.5">
                  <span className="text-xs font-semibold text-slate-500">Customization Submissions:</span>
                  <span className="font-bold text-indigo-700">{selectedCustomer.submissionsCount ?? 0}</span>
                </div>
              </div>
            </div>

            {/* MODAL FOOTER */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
              <Button
                variant={selectedCustomer.isActive ? "outline" : "default"}
                size="sm"
                disabled={isTogglingId === selectedCustomer.id}
                onClick={() => handleToggleStatus(selectedCustomer)}
                className={
                  selectedCustomer.isActive
                    ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }
              >
                {isTogglingId === selectedCustomer.id ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : selectedCustomer.isActive ? (
                  <>
                    <UserRoundX size={14} /> Deactivate Account
                  </>
                ) : (
                  <>
                    <UserRoundCheck size={14} /> Activate Account
                  </>
                )}
              </Button>

              <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
