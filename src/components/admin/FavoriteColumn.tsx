"use client";

import { useState } from "react";
import FavoriteUsersModal, { FavoriteUsersDict } from "./FavoriteUsersModal";

type FavUser = {
  user: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  createdAt: string | Date;
};

export default function FavoriteColumn({
  users,
  dict,
}: {
  users: FavUser[];
  dict: FavoriteUsersDict;
}) {
  const [open, setOpen] = useState(false);
  const count = users.length;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={dict.favorites}
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11.5px] font-[950] border border-[var(--line-2)] bg-[var(--soft)] text-[var(--primary)] transition-all hover:bg-[var(--primary)] hover:text-white"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <span dir="ltr">{count}</span>
      </button>

      <FavoriteUsersModal
        open={open}
        onClose={() => setOpen(false)}
        users={users}
        dict={dict}
      />
    </>
  );
}
