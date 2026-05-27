"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Group {
  id: string;
  name: string;
  icon: string;
}

interface Props {
  groups: Group[];
  activeGroupId: string | null;
  yearMonth: string;
}

export function GroupSwitcher({ groups, activeGroupId, yearMonth }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  if (groups.length === 0) return null;

  function navigate(groupId: string | null) {
    const params = new URLSearchParams();
    if (yearMonth) params.set("month", yearMonth);
    if (groupId)   params.set("group", groupId);
    router.push(`/overview?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Personal pill */}
      <button
        onClick={() => navigate(null)}
        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
          !activeGroupId
            ? "bg-[#FEFF6E] text-[#1A1A1A]"
            : "text-foreground/40 hover:text-foreground hover:bg-foreground/6"
        }`}
      >
        Personal
      </button>

      {/* Group pills */}
      {groups.map((g) => (
        <button
          key={g.id}
          onClick={() => navigate(g.id)}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors flex items-center gap-1 ${
            activeGroupId === g.id
              ? "bg-[#FEFF6E] text-[#1A1A1A]"
              : "text-foreground/40 hover:text-foreground hover:bg-foreground/6"
          }`}
        >
          <span>{g.icon}</span>
          {g.name}
        </button>
      ))}
    </div>
  );
}
