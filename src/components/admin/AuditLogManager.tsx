"use client";

import { useEffect, useState } from "react";

type AuditLogDict = {
  title: string;
  subtitle: string;
  empty: string;
  admin: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  time: string;
  filterEntity: string;
  filterAction: string;
  all: string;
  loadMore: string;
  actions: Record<string, string>;
  entities: Record<string, string>;
};

interface AuditLog {
  id: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  createdAt: string;
}

const ENTITIES = [
  "product",
  "category",
  "setting",
  "coupon",
  "theme",
  "order",
  "contact_message",
  "email",
  "message",
];

const ACTIONS = [
  "create",
  "update",
  "delete",
  "upsert",
  "update_status",
  "mark_read",
  "mark_unread",
  "send_test_email",
  "send_message",
];

export default function AuditLogManager({ dict }: { dict: AuditLogDict }) {
  const d = dict;

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterEntity, setFilterEntity] = useState("");
  const [filterAction, setFilterAction] = useState("");

  const fetchLogs = async (cursor?: string, append = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "50" });
      if (filterEntity) params.set("entity", filterEntity);
      if (filterAction) params.set("action", filterAction);
      if (cursor) params.set("cursor", cursor);

      const res = await fetch(`/api/admin/audit?${params}`);
      if (res.ok) {
        const json = await res.json();
        const payload = json.data ?? json;
        setLogs((prev) => (append ? [...prev, ...payload.logs] : payload.logs));
        setHasMore(payload.hasMore);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, [filterEntity, filterAction]);

  const loadMore = () => {
    if (logs.length > 0) {
      fetchLogs(logs[logs.length - 1].id, true);
    }
  };

  const fmtDate = (iso: string) => {
    return new Date(iso).toLocaleString("fa-IR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fmtDetails = (details: Record<string, unknown> | null) => {
    if (!details) return "—";
    try {
      return JSON.stringify(details, null, 0);
    } catch {
      return "—";
    }
  };

  return (
    <div>
      <h2 className="text-[18px] font-[1000] text-[var(--text)]">{d.title}</h2>
      <p className="mt-1 text-[13px] font-[850] text-[var(--muted)]">{d.subtitle}</p>

      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={filterEntity}
          onChange={(e) => setFilterEntity(e.target.value)}
          className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] font-[850] text-[var(--text)]"
        >
          <option value="">{d.filterEntity} ({d.all})</option>
          {ENTITIES.map((e) => (
            <option key={e} value={e}>{d.entities[e] ?? e}</option>
          ))}
        </select>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-[12px] border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-[13px] font-[850] text-[var(--text)]"
        >
          <option value="">{d.filterAction} ({d.all})</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>{d.actions[a] ?? a}</option>
          ))}
        </select>
      </div>

      <div className="mt-4 bg-[var(--surface)] border border-[var(--line)] rounded-[18px] overflow-hidden">
        {logs.length === 0 && !loading ? (
          <p className="p-6 text-[13.5px] font-[850] text-[var(--muted)]">{d.empty}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-right border-b border-[var(--surface-3)] text-[var(--muted)] font-[900]">
                  <th className="px-4 py-3">{d.admin}</th>
                  <th className="px-4 py-3">{d.action}</th>
                  <th className="px-4 py-3">{d.entity}</th>
                  <th className="px-4 py-3">{d.entityId}</th>
                  <th className="px-4 py-3">{d.details}</th>
                  <th className="px-4 py-3">{d.time}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--surface-3)]">
                {logs.map((log) => (
                  <tr key={log.id} className="font-[850] text-[var(--text-3)]">
                    <td className="px-4 py-3" dir="ltr">{log.userEmail}</td>
                    <td className="px-4 py-3">
                      <span className="bg-[var(--soft)] text-[var(--primary)] rounded-full px-2.5 py-1 text-[11px] font-[950]">
                        {d.actions[log.action] ?? log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-[var(--soft)] text-[var(--primary)] rounded-full px-2.5 py-1 text-[11px] font-[950]">
                        {d.entities[log.entity] ?? log.entity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]" dir="ltr">
                      {log.entityId ? log.entityId.slice(0, 8) + "…" : "—"}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)] max-w-[260px] truncate" title={fmtDetails(log.details)}>
                      {fmtDetails(log.details)}
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                      {fmtDate(log.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {hasMore && (
        <div className="mt-4 text-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-[12px] bg-[var(--soft)] text-[var(--primary)] px-5 py-2.5 text-[13px] font-[950] hover:bg-[var(--primary)] hover:text-white transition-colors disabled:opacity-50"
          >
            {d.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}
