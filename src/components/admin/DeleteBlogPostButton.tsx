"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Dict = {
  delete: string;
  deleteConfirm: string;
};

export default function DeleteBlogPostButton({
  id,
  title,
  dict,
}: {
  id: string;
  title: string;
  dict: Dict;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!window.confirm(dict.deleteConfirm.replace("{title}", title))) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.ok) router.refresh();
      else alert(json.error || "Error");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="px-3 py-1.5 rounded-[10px] text-[11.5px] font-[900] text-red-500 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
    >
      {loading ? "..." : dict.delete}
    </button>
  );
}
