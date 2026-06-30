"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trash2, UserPlus, X, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCOP } from "@/lib/utils/currency";

interface Member {
  user_id: string;
  role: string;
  users: { full_name: string | null; phone_number: string | null } | null;
}

interface Group {
  id: string;
  name: string;
  icon: string;
  color: string;
  owner_id: string;
  group_members: Member[];
}

const GROUP_ICONS = ["👨‍👩‍👧", "✈️", "🏠", "🎉", "💼", "🏖️", "🛒", "🎮"];

export function GroupsManager({
  userId,
  initialOwned,
  initialMember,
  spendingByGroup,
}: {
  userId: string;
  initialOwned: Group[];
  initialMember: Group[];
  spendingByGroup: Record<string, number>;
}) {
  const [owned, setOwned]     = useState<Group[]>(initialOwned);
  const [member, setMember]   = useState<Group[]>(initialMember);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName]   = useState("");
  const [newIcon, setNewIcon]   = useState("👨‍👩‍👧");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [confirming, setConfirming] = useState<{ groupId: string; action: "delete" | "leave" } | null>(null);
  const [busy, setBusy]         = useState(false);
  const [actionError, setActionError] = useState<{ groupId: string; message: string } | null>(null);
  const router = useRouter();

  async function refetch() {
    const res = await fetch("/api/groups");
    if (res.ok) {
      const d = await res.json() as { owned: Group[]; member: Group[] };
      setOwned(d.owned ?? []);
      setMember(d.member ?? []);
    }
  }

  async function createGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon }),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "No se pudo crear el grupo");
      return;
    }
    setNewName("");
    setNewIcon("👨‍👩‍👧");
    setCreating(false);
    await refetch();
    router.refresh();
  }

  async function deleteGroup(groupId: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setActionError({ groupId, message: d.error ?? "No se pudo eliminar el grupo" });
        return;
      }
      setConfirming(null);
      await refetch();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function leaveGroup(groupId: string) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json() as { error?: string };
        setActionError({ groupId, message: d.error ?? "No se pudo salir del grupo" });
        return;
      }
      setConfirming(null);
      await refetch();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(groupId: string, memberId: string) {
    await fetch(`/api/groups/${groupId}/members/${memberId}`, { method: "DELETE" });
    await refetch();
  }

  const allGroups = [...owned, ...member];

  return (
    <div className="bg-card rounded-2xl p-5 space-y-4">
      <p className="text-[10px] uppercase tracking-widest text-foreground/40">
        Grupos de gastos compartidos
      </p>

      {/* Group list */}
      {allGroups.length > 0 && (
        <div className="space-y-2">
          {allGroups.map((group) => {
            const isOwner    = group.owner_id === userId;
            const isExpanded = expanded === group.id;
            const memberCount = group.group_members?.length ?? 0;
            const spent = spendingByGroup[group.id] ?? 0;

            return (
              <div key={group.id} className="rounded-xl border border-foreground/8 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xl shrink-0">{group.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{group.name}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs text-foreground/40">
                        {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
                        {!isOwner && " · Participante"}
                      </p>
                      {spent > 0 && (
                        <p className="text-xs text-foreground/50 font-medium">
                          {formatCOP(spent)} este mes
                        </p>
                      )}
                    </div>
                  </div>
                  {confirming?.groupId === group.id ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-foreground/50">
                        {confirming.action === "delete" ? "¿Eliminar grupo?" : "¿Salir del grupo?"}
                      </span>
                      <button
                        onClick={() => confirming.action === "delete" ? deleteGroup(group.id) : leaveGroup(group.id)}
                        disabled={busy}
                        className="text-xs font-medium text-destructive hover:opacity-70 disabled:opacity-50"
                      >
                        {busy ? "..." : "Sí"}
                      </button>
                      <button
                        onClick={() => { setConfirming(null); setActionError(null); }}
                        className="text-xs text-foreground/40 hover:text-foreground"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Link to deep dive */}
                      <Link
                        href={`/groups/${group.id}`}
                        className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/6 transition-colors"
                        title="Ver gastos"
                      >
                        <ArrowRight size={15} />
                      </Link>

                      {isOwner && (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : group.id)}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-foreground/6 transition-colors"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}
                      {isOwner ? (
                        <button
                          onClick={() => { setConfirming({ groupId: group.id, action: "delete" }); setActionError(null); }}
                          className="p-1.5 rounded-lg text-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-colors"
                          title="Eliminar grupo"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => { setConfirming({ groupId: group.id, action: "leave" }); setActionError(null); }}
                          className="text-xs text-foreground/40 hover:text-destructive transition-colors px-2 py-1"
                        >
                          Salir
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Inline confirm hint + error */}
                {confirming?.groupId === group.id && confirming.action === "delete" && (
                  <p className="px-4 pb-2 -mt-1 text-[11px] text-foreground/40">
                    Los gastos del grupo seguirán en tu historial.
                  </p>
                )}
                {actionError?.groupId === group.id && (
                  <p className="px-4 pb-2 -mt-1 text-[11px] text-destructive">{actionError.message}</p>
                )}

                {/* Expanded: member management (owner only) */}
                {isOwner && isExpanded && (
                  <div className="border-t border-foreground/8 px-4 py-3 space-y-3">
                    <div className="space-y-1.5">
                      {(group.group_members ?? []).map((m) => (
                        <div key={m.user_id} className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-xs font-medium truncate">
                              {m.users?.full_name ?? "Sin nombre"}
                              {m.role === "owner" && (
                                <span className="ml-1.5 text-[10px] text-foreground/40 uppercase tracking-wider">owner</span>
                              )}
                            </p>
                            <p className="text-[11px] text-foreground/40 truncate">
                              {m.users?.phone_number ?? ""}
                            </p>
                          </div>
                          {m.role !== "owner" && (
                            <button
                              onClick={() => removeMember(group.id, m.user_id)}
                              className="p-1 rounded text-foreground/30 hover:text-destructive transition-colors shrink-0"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    <AddMemberRow groupId={group.id} onAdded={refetch} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {allGroups.length === 0 && !creating && (
        <p className="text-sm text-foreground/40">
          Aún no tienes grupos. Crea uno para compartir gastos con tu familia o amigos.
        </p>
      )}

      {/* Create group form */}
      {creating ? (
        <form onSubmit={createGroup} className="space-y-3">
          <div className="flex gap-2">
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="h-11 rounded-md border border-input bg-background px-2 text-xl w-16 shrink-0"
            >
              {GROUP_ICONS.map((ic) => (
                <option key={ic} value={ic}>{ic}</option>
              ))}
            </select>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del grupo (ej: Familiar)"
              className="h-11 flex-1"
              autoFocus
              required
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" className="flex-1 h-10" disabled={saving || !newName.trim()}>
              {saving ? "Creando..." : "Crear grupo"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 px-4"
              onClick={() => { setCreating(false); setError(""); }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm font-semibold border border-dashed border-border rounded-2xl px-4 py-3 w-full hover:bg-foreground/4 transition-colors text-muted-foreground"
        >
          <span className="text-lg">+</span>
          Nuevo grupo
        </button>
      )}

      <div className="space-y-1.5 pt-1 border-t border-foreground/6">
        <p className="text-xs text-muted-foreground font-medium">¿Cómo usar los grupos?</p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/60">Crear desde WhatsApp:</span>{" "}
          <span className="font-mono">&quot;crea un grupo para el viaje a NY&quot;</span>
        </p>
        <p className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground/60">Registrar un gasto al grupo:</span>{" "}
          <span className="font-mono">&quot;40 mil en mercado para familia&quot;</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Los gastos sin mención de grupo siempre son personales.
        </p>
      </div>
    </div>
  );
}

function AddMemberRow({ groupId, onAdded }: { groupId: string; onAdded: () => void }) {
  const [phone, setPhone]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError("");
    setSuccess("");

    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: phone.trim() }),
    });

    setLoading(false);
    if (!res.ok) {
      const d = await res.json() as { error?: string };
      setError(d.error ?? "No se pudo agregar");
      return;
    }
    setPhone("");
    setSuccess("¡Agregado! Le enviamos un mensaje de WhatsApp.");
    onAdded();
    setTimeout(() => setSuccess(""), 3000);
  }

  return (
    <form onSubmit={handleAdd} className="space-y-1.5">
      <div className="flex gap-2">
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+57 300 123 4567"
          type="tel"
          className="h-9 text-sm flex-1"
        />
        <button
          type="submit"
          disabled={loading || !phone.trim()}
          className="h-9 px-3 rounded-lg bg-foreground text-background text-xs font-semibold disabled:opacity-40 shrink-0 flex items-center gap-1.5"
        >
          <UserPlus size={13} />
          {loading ? "..." : "Agregar"}
        </button>
      </div>
      {error   && <p className="text-xs text-destructive">{error}</p>}
      {success && <p className="text-xs text-green-600">{success}</p>}
    </form>
  );
}
