import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import * as ReactDOM from "react-dom";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import {
  fetchMessagesRecus,
  fetchMessagesEnvoyes,
  fetchMessagesNonLusCount,
  envoyerMessage,
  marquerMessageLu,
} from "@/store/slices/communicationSlice";
import { userApi } from "@/api/userApi";
import { messageApi } from "@/api/communicationApi";
import type { UserMinimal } from "@/types/communication";
import type { Message as ApiMessage } from "@/types/communication";
import type { User as AppUser } from "@/types";

// ── Types (UI) ──────────────────────────────────────────────────────────────
interface User {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  role: string;
  online?: boolean;
}

interface Message {
  id: number;
  lu: boolean;
  dateEnvoi: string;
  sujet: string | null;
  contenu: string;
  expediteur: User;
  destinataire: User;
  parentId?: number | null;
  piecesJointes?: { id: number; nomOriginal: string; typeMime: string | null; tailleOctets: number }[];
  mentions?: { id: number; prenom: string; nom: string; email: string }[];
  createdAt?: string;
  updatedAt?: string;
}

function mapUserMinimal(u: UserMinimal, role = ""): User {
  return { id: u.id, prenom: u.prenom, nom: u.nom, email: u.email, role };
}

function mapApiMessageToLocal(m: ApiMessage): Message {
  return {
    id: m.id,
    lu: m.lu,
    dateEnvoi: m.dateEnvoi,
    sujet: m.sujet ?? null,
    contenu: m.contenu,
    expediteur: mapUserMinimal(m.expediteur),
    destinataire: mapUserMinimal(m.destinataire),
    parentId: m.parentId ?? null,
    piecesJointes: m.piecesJointes,
    mentions: m.mentions,
    createdAt: m.createdAt ?? "",
    updatedAt: m.updatedAt ?? "",
  };
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const GRADS = [
  ["#7C3AED","#4F46E5"],["#0EA5E9","#0284C7"],["#10B981","#059669"],
  ["#F97316","#EA580C"],["#EC4899","#DB2777"],["#6366F1","#4338CA"],
  ["#14B8A6","#0D9488"],["#8B5CF6","#7C3AED"],
];
function avatarGrad(name: string): [string, string] {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h*31+name.charCodeAt(i))&0xffff;
  return GRADS[h % GRADS.length] as [string, string];
}
function initials(p?: string, n?: string): string { return `${p?.[0]??''}${n?.[0]??''}`.toUpperCase(); }

/** Affiche le contenu d'un message en rendant les @Prénom Nom (mentions) en span cliquable et coloré */
function renderMessageWithMentions(
  contenu: string,
  mentions: { id: number; prenom: string; nom: string }[] | undefined
): React.ReactNode {
  if (!mentions?.length) return contenu;
  const patterns = mentions.map((m) => `@${m.prenom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} ${m.nom.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  const regex = new RegExp(`(${patterns.join("|")})`, "g");
  const parts = contenu.split(regex);
  return parts.map((part, i) => {
    const mention = mentions.find((m) => part === `@${m.prenom} ${m.nom}`);
    if (mention) {
      return (
        <span
          key={i}
          role="button"
          tabIndex={0}
          onClick={() => {}}
          onKeyDown={(e) => e.key === "Enter" && (() => {})()}
          className="font-semibold cursor-pointer px-1 py-0.5 rounded text-[var(--msg-accent)] bg-[var(--msg-accent-muted)]"
          title={`${mention.prenom} ${mention.nom}`}
        >
          {part}
        </span>
      );
    }
    return <span key={i}>{part}</span>;
  });
}
function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(diff/3600000), d = Math.floor(diff/86400000);
  if(m<1) return "À l'instant"; if(m<60) return `${m}m`; if(h<24) return `${h}h`;
  if(d===1) return "Hier"; if(d<7) return new Date(iso).toLocaleDateString('fr-FR',{weekday:'short'});
  return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
}
function fullTime(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'});
}

// ── Avatar (style professionnel) ───────────────────────────────────────────────
function Av({ p, n, size = 40, online = false }: { p?: string; n?: string; size?: number; online?: boolean }) {
  const [c1, c2] = avatarGrad((p ?? "") + (n ?? ""));
  return (
    <div className="relative flex-shrink-0 inline-flex">
      <div
        className="flex items-center justify-center rounded-full font-semibold text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10"
        style={{
          width: size,
          height: size,
          minWidth: size,
          fontSize: Math.round(size * 0.38),
          letterSpacing: "0.02em",
          background: `linear-gradient(145deg, ${c1}, ${c2})`,
        }}
      >
        {initials(p, n)}
      </div>
      {online && (
        <span
          className="absolute bottom-0 right-0 rounded-full border-2 border-[var(--msg-bg-panel)] bg-emerald-500"
          style={{ width: Math.round(size * 0.28), height: Math.round(size * 0.28) }}
          aria-hidden
        />
      )}
    </div>
  );
}

// ── Highlight ─────────────────────────────────────────────────────────────────
function Hi({ text, q }: { text: string; q: string }) {
  if (!q.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi'));
  return <>{parts.map((p: string, i: number) =>
    p.toLowerCase()===q.toLowerCase()
      ? <mark key={i} className="bg-[var(--msg-accent-muted)] text-[var(--msg-accent)] rounded px-0.5 font-medium">{p}</mark>
      : <span key={i}>{p}</span>
  )}</>;
}

/** Une conversation = un interlocuteur + ses messages (triés par date) */
interface Conversation {
  peerId: number;
  peer: User;
  messages: Message[];
}

// ── Ligne conversation (une ligne par interlocuteur, pas par message) ─────────
function ConvRow({ conv, tab, selected, q, onClick, users: USERS }: { conv: Conversation; tab: "recus" | "envoyes"; selected: boolean; q: string; onClick: () => void; users: User[] }) {
  const { peer, messages } = conv;
  const last = messages[messages.length - 1];
  const unreadCount = tab === "recus" ? messages.filter((m) => !m.lu).length : 0;
  const user: Partial<User> = USERS.find((u) => u.id === peer.id) ?? {};

  return (
    <button
      type="button"
      onClick={onClick}
      className={`msg-row w-full text-left flex gap-3 cursor-pointer border-none border-b border-[var(--msg-border-subtle)] relative transition-[background-color,border-color] duration-150 ease-out
        px-4 py-3.5
        ${selected ? "bg-[var(--msg-bg-selected)] border-l-[3px] border-l-[var(--msg-accent)]" : "hover:bg-[var(--msg-bg-list-hover)]"}
        ${unreadCount > 0 ? "bg-[var(--msg-bg-list)]" : ""}`}
    >
      <Av p={peer.prenom} n={peer.nom} size={42} online={user.online} />
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className={`text-[13px] truncate leading-tight font-medium ${unreadCount > 0 ? "text-[var(--msg-text-primary)] font-semibold" : "text-[var(--msg-text-secondary)]"}`}>
            <Hi text={`${peer.prenom} ${peer.nom}`} q={q} />
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            {unreadCount > 0 && <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--msg-accent)] text-white text-[10px] font-bold rounded-full">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            <span className="text-[11px] text-[var(--msg-text-muted)] tabular-nums font-medium">
              {relTime(last.dateEnvoi)}
            </span>
          </span>
        </div>
        {last.sujet && (
          <p className="text-xs truncate mb-0.5 leading-tight text-[var(--msg-text-muted)]">
            <Hi text={last.sujet} q={q} />
          </p>
        )}
        <p className="text-[12px] text-[var(--msg-text-muted)] line-clamp-2 leading-snug m-0">
          <Hi text={last.contenu} q={q} />
        </p>
      </div>
    </button>
  );
}

// ── Reader (fil de conversation : tous les messages avec réponses associées) ───
function Reader({ conversation, tab, onReply, users: USERS, onDownloadPieceJointe, isArchived, onArchive, onUnarchive, onSuppressForMe, t }: {
  conversation: Conversation; tab: "recus" | "envoyes"; onReply: () => void; users: User[];
  onDownloadPieceJointe: (pieceJointeId: number, filename: string) => void;
  isArchived: boolean; onArchive: () => void; onUnarchive: () => void;
  onSuppressForMe?: () => void;
  t: (key: string) => string;
}) {
  const { peer, messages } = conversation;
  const lastMsg = messages[messages.length - 1];
  const unreadInConv = tab === "recus" ? messages.filter((m) => !m.lu).length : 0;
  const user: Partial<User> = USERS.find(u=>u.id===peer.id) ?? {};
  const [c1] = avatarGrad(peer.prenom+peer.nom);
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsTriggerRef = useRef<HTMLButtonElement>(null);
  const MENU_MIN_WIDTH = 240;
  const VIEWPORT_PADDING = 20;
  const [menuPosition, setMenuPosition] = useState<{
    top?: number; bottom?: number; right?: number; left?: number; maxHeight: number; width?: number;
  } | null>(null);

  useLayoutEffect(() => {
    if (!actionsOpen || !actionsTriggerRef.current) { setMenuPosition(null); return; }
    const rect = actionsTriggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const dropdownLeftEdge = rect.right - MENU_MIN_WIDTH;
    const safeLeft = VIEWPORT_PADDING;
    const useRight = dropdownLeftEdge >= safeLeft;
    const right = useRight ? vw - rect.right : vw - (safeLeft + MENU_MIN_WIDTH);
    const maxW = Math.min(320, vw - VIEWPORT_PADDING * 2);
    const width = vw < 400 ? maxW : undefined;
    const spaceBelow = vh - rect.bottom - VIEWPORT_PADDING;
    const menuEstimatedHeight = 280;
    const showAbove = spaceBelow < menuEstimatedHeight && rect.top > spaceBelow;
    const maxHeight = showAbove ? rect.top - VIEWPORT_PADDING : vh - (rect.bottom + 6) - VIEWPORT_PADDING;
    setMenuPosition({
      ...(showAbove ? { bottom: vh - rect.top + 6 } : { top: rect.bottom + 6 }),
      right: width ? undefined : right,
      left: width ? VIEWPORT_PADDING : undefined,
      ...(width ? { width } : {}),
      maxHeight: Math.max(200, maxHeight),
    });
  }, [actionsOpen]);

  const closeActions = useCallback(() => setActionsOpen(false), []);
  useEffect(() => {
    if (!actionsOpen) return;
    const onEscape = (e: KeyboardEvent) => { if (e.key === "Escape") closeActions(); };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [actionsOpen, closeActions]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-[var(--msg-bg-panel)]">
      <header className="flex-shrink-0 border-b border-[var(--msg-border)] px-5 sm:px-8 py-5 shadow-[var(--msg-shadow-sm)]">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex gap-4 items-start min-w-0 flex-1">
            <Av p={peer.prenom} n={peer.nom} size={48} online={user.online}/>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-base font-semibold text-[var(--msg-text-primary)] truncate">
                  {peer.prenom} {peer.nom}
                </span>
                <span className="text-[11px] px-2.5 py-1 rounded-md font-medium shrink-0 border border-[var(--msg-border)] bg-[var(--msg-bg-list)] text-[var(--msg-text-secondary)]" style={{ borderColor: `${c1}40` }}>
                  {user.role || (tab==="recus"?t("messagerie.expediteur"):t("messagerie.destinataireLabel"))}
                </span>
                {unreadInConv > 0 && tab==="recus" && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-md font-medium bg-[var(--msg-accent-muted)] text-[var(--msg-accent)] shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--msg-accent)]" />
                    {t("messagerie.unread")}
                  </span>
                )}
              </div>
              {peer.email && <p className="text-xs text-[var(--msg-text-muted)] truncate font-mono mb-1">{peer.email}</p>}
              <div className="flex items-center gap-2 text-xs text-[var(--msg-text-muted)]">
                <svg className="shrink-0 opacity-80" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                {messages.length} message(s) · {fullTime(lastMsg.dateEnvoi)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {tab==="recus" && (
              <button type="button" onClick={onReply} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--msg-radius-sm)] bg-[var(--msg-accent)] hover:bg-[var(--msg-accent-hover)] text-white text-sm font-semibold shadow-[var(--msg-shadow-sm)] transition-colors duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>
                {t("messagerie.reply")}
              </button>
            )}
            <div className="relative">
              <button ref={actionsTriggerRef} type="button" onClick={() => setActionsOpen((o) => !o)} className="p-2.5 rounded-[var(--msg-radius-sm)] border border-[var(--msg-border)] bg-[var(--msg-bg-list)] text-[var(--msg-text-secondary)] hover:bg-[var(--msg-bg-list-hover)] hover:text-[var(--msg-text-primary)] transition-colors duration-150" aria-label={t("messagerie.actions")} aria-expanded={actionsOpen} aria-haspopup="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
              </button>
              {actionsOpen && menuPosition && typeof document !== "undefined" && ReactDOM.createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" aria-hidden onClick={closeActions} />
                  <div className="fixed z-[9999] min-w-[240px] max-w-[calc(100vw-2.5rem)] rounded-xl border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] shadow-lg overflow-hidden flex flex-col" style={{ top: menuPosition.top, bottom: menuPosition.bottom, left: menuPosition.left, right: menuPosition.right, width: menuPosition.width, maxHeight: menuPosition.maxHeight }} role="menu">
                    <div className="px-3.5 py-2.5 border-b border-[var(--msg-border-subtle)] flex-shrink-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)]">{t("messagerie.actions")}</p></div>
                    <div className="py-1.5 overflow-y-auto flex-1 min-h-0">
                      {isArchived ? (
                        <button type="button" role="menuitem" onClick={() => { onUnarchive(); closeActions(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--msg-text-primary)] hover:bg-[var(--msg-bg-list-hover)] transition-colors">
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--msg-bg-list)] flex items-center justify-center text-[var(--msg-text-secondary)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></span>
                          <span className="font-medium">{t("messagerie.unarchive")}</span>
                        </button>
                      ) : (
                        <button type="button" role="menuitem" onClick={() => { onArchive(); closeActions(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-[var(--msg-text-primary)] hover:bg-[var(--msg-bg-list-hover)] transition-colors">
                          <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[var(--msg-bg-list)] flex items-center justify-center text-[var(--msg-text-secondary)]"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span>
                          <span className="font-medium">{t("messagerie.archive")}</span>
                        </button>
                      )}
                      {onSuppressForMe && (
                        <>
                          <div className="my-1 border-t border-[var(--msg-border-subtle)]" />
                          <button type="button" role="menuitem" onClick={() => { onSuppressForMe(); closeActions(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors">
                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></span>
                            <span className="font-medium">{t("messagerie.deleteForMe")}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </>,
                document.body
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="msg-scroll flex-1 min-h-0 overflow-y-auto px-5 sm:px-8 py-6">
        <div className="max-w-2xl space-y-8">
          {messages.map((msg) => {
            const parent = msg.parentId ? messages.find((m) => m.id === msg.parentId) : null;
            const isFromPeer = msg.expediteur.id === peer.id;
            return (
              <article key={msg.id} className="border border-[var(--msg-border)] rounded-[var(--msg-radius-sm)] bg-[var(--msg-bg-list)]/50 overflow-hidden">
                {parent && (
                  <div className="px-4 py-2 border-b border-[var(--msg-border-subtle)] bg-[var(--msg-bg-panel)]/80 text-xs text-[var(--msg-text-muted)]">
                    <span className="font-medium text-[var(--msg-accent)]">{t("messagerie.inReplyTo")}</span>
                    {" : "}
                    {parent.sujet || parent.contenu.slice(0, 80).replace(/\n/g, " ")}
                    {parent.contenu.length > 80 ? "…" : ""}
                  </div>
                )}
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-medium text-[var(--msg-text-secondary)]">
                      {msg.expediteur.prenom} {msg.expediteur.nom} · {fullTime(msg.dateEnvoi)}
                    </span>
                    {!msg.lu && tab==="recus" && isFromPeer && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--msg-accent-muted)] text-[var(--msg-accent)]">{t("messagerie.unread")}</span>}
                  </div>
                  {msg.sujet && <h3 className="text-sm font-semibold text-[var(--msg-text-primary)] mb-2">{msg.sujet}</h3>}
                  <p className="text-[15px] leading-[1.65] text-[var(--msg-text-primary)] whitespace-pre-wrap">
                    {renderMessageWithMentions(msg.contenu, msg.mentions)}
                  </p>
                  {(msg.piecesJointes?.length ?? 0) > 0 && (
                    <div className="mt-4 pt-4 border-t border-[var(--msg-border)]">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)] mb-2">{t("messagerie.attachments")}</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.piecesJointes!.map((pj) => (
                          <button key={pj.id} type="button" onClick={() => onDownloadPieceJointe(pj.id, pj.nomOriginal)} className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--msg-bg-panel)] border border-[var(--msg-border)] text-sm text-[var(--msg-text-primary)] hover:bg-[var(--msg-bg-list-hover)] text-left min-w-0">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            <span className="truncate max-w-[140px]" title={pj.nomOriginal}>{pj.nomOriginal}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Empty Reader (état vide professionnel) ─────────────────────────────────────
function EmptyReader({ onCompose, t }: { onCompose: () => void; t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] select-none px-6 bg-[var(--msg-bg-panel)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--msg-bg-list)] border border-[var(--msg-border)] flex items-center justify-center mb-5 text-[var(--msg-text-muted)]">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p className="text-base font-semibold text-[var(--msg-text-primary)] mb-1.5">
        {t("messagerie.noMessageSelected")}
      </p>
      <p className="text-sm text-[var(--msg-text-muted)] max-w-[280px] text-center leading-relaxed mb-6">
        {t("messagerie.selectOrCompose")}
      </p>
      <button
        type="button"
        onClick={onCompose}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--msg-radius-sm)] bg-[var(--msg-accent)] hover:bg-[var(--msg-accent-hover)] text-white text-sm font-semibold shadow-[var(--msg-shadow-sm)] transition-colors duration-150"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        {t("messagerie.newMessage")}
      </button>
    </div>
  );
}

// ── Panneau Archivés (droite quand onglet Archivés) ───────────────────────────
function ArchivesPanel({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[280px] select-none px-6 bg-[var(--msg-bg-panel)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--msg-bg-list)] border border-[var(--msg-border)] flex items-center justify-center mb-5 text-[var(--msg-text-muted)]">
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
        </svg>
      </div>
      <p className="text-base font-semibold text-[var(--msg-text-primary)] mb-1.5">
        {t("messagerie.archivesTitle")}
      </p>
      <p className="text-sm text-[var(--msg-text-muted)] max-w-[300px] text-center leading-relaxed">
        {t("messagerie.archivesDescription")}
      </p>
      <p className="text-xs text-[var(--msg-text-muted)] max-w-[280px] text-center mt-3 opacity-90">
        {t("messagerie.archivesRestoreHint")}
      </p>
    </div>
  );
}

// ── Ligne conversation archivée ──────────────────────────────────────────────
function ArchivedRow({ user, onUnarchive, t }: { user: User; onUnarchive: () => void; t: (key: string) => string }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-[var(--msg-radius-sm)] border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] hover:border-[var(--msg-accent)]/30 transition-colors">
      <Av p={user.prenom} n={user.nom} size={40} />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[var(--msg-text-primary)] truncate">{user.prenom} {user.nom}</p>
        <p className="text-xs text-[var(--msg-text-muted)] truncate">{user.role || user.email}</p>
      </div>
      <button
        type="button"
        onClick={onUnarchive}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--msg-radius-sm)] text-xs font-medium bg-[var(--msg-accent-muted)] text-[var(--msg-accent)] hover:bg-[var(--msg-accent)] hover:text-white transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        {t("messagerie.unarchive")}
      </button>
    </div>
  );
}

// ── Compose Drawer ────────────────────────────────────────────────────────────
interface ComposeProps {
  open: boolean;
  onClose: () => void;
  onSend: (payload: { destId: string; sujet: string; contenu: string; files?: File[]; mentionIds?: number[] }) => void;
  replyTo: User | null;
  users: User[];
  usersLoading?: boolean;
  onRefreshUsers?: () => void;
  t: (key: string, opts?: Record<string, string | number>) => string;
}

function matchMentionQuery(user: User, q: string): boolean {
  const lower = q.toLowerCase();
  const full = `${user.prenom} ${user.nom}`.toLowerCase();
  const fullRev = `${user.nom} ${user.prenom}`.toLowerCase();
  return full.includes(lower) || fullRev.includes(lower) || !!(user.email && user.email.toLowerCase().includes(lower));
}

function Compose({ open, onClose, onSend, replyTo, users: USERS, usersLoading, onRefreshUsers, t }: ComposeProps) {
  const [destId, setDestId] = useState("");
  const [sujet, setSujet] = useState("");
  const [contenu, setContenu] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [mentionIds, setMentionIds] = useState<number[]>([]);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [, setMentionStart] = useState(0);
  const [sending, setSending] = useState(false);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sendingRef = useRef(false);
  const mentionSnapshotRef = useRef<{ contenu: string; mentionStart: number; mentionQuery: string }>({ contenu: "", mentionStart: 0, mentionQuery: "" });

  useEffect(() => {
    if (open) {
      if (replyTo) { setDestId(String(replyTo.id)); setSujet(s => s ? `Re: ${s}` : ""); }
      setFiles([]);
      setMentionIds([]);
      setMentionOpen(false);
      setTimeout(() => taRef.current?.focus(), 200);
    } else { setDestId(""); setSujet(""); setContenu(""); setFiles([]); setMentionIds([]); setMentionOpen(false); setSending(false); sendingRef.current = false; }
  }, [open, replyTo]);

  const dest = USERS.find(u => String(u.id) === destId);
  const canSend = !!destId && contenu.trim().length > 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files ? Array.from(e.target.files) : [];
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  };
  const removeFile = (index: number) => setFiles((prev) => prev.filter((_, i) => i !== index));

  const handleContenuChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value;
    const pos = e.target.selectionStart ?? v.length;
    setContenu(v);
    const before = v.slice(0, pos);
    const lastAt = before.lastIndexOf("@");
    if (lastAt === -1 || (lastAt >= 0 && /\s/.test(before.slice(lastAt + 1)))) {
      setMentionOpen(false);
      return;
    }
    const query = before.slice(lastAt + 1);
    if (query.includes(" ") || query.length > 30) { setMentionOpen(false); return; }
    setMentionQuery(query);
    setMentionStart(lastAt);
    setMentionOpen(true);
    mentionSnapshotRef.current = { contenu: v, mentionStart: lastAt, mentionQuery: query };
  };

  const mentionCandidates = USERS.filter(
    (u) => String(u.id) !== destId && matchMentionQuery(u, mentionQuery)
  ).slice(0, 8);

  const insertMention = (user: User) => {
    const snap = mentionSnapshotRef.current;
    const queryLen = snap.mentionQuery.length;
    const before = snap.contenu.slice(0, snap.mentionStart);
    const after = snap.contenu.slice(snap.mentionStart + 1 + queryLen);
    const insert = `@${user.prenom} ${user.nom} `;
    const newContenu = before + insert + after;
    setContenu(newContenu);
    setMentionIds((ids) => (ids.includes(user.id) ? ids : [...ids, user.id]));
    setMentionOpen(false);
    setMentionQuery("");
    mentionSnapshotRef.current = { contenu: newContenu, mentionStart: snap.mentionStart, mentionQuery: "" };
    setTimeout(() => {
      taRef.current?.focus();
      const newPos = snap.mentionStart + insert.length;
      taRef.current?.setSelectionRange(newPos, newPos);
    }, 80);
  };

  const handleSend = () => {
    if (!canSend || sending || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    onSend({ destId, sujet, contenu, files: files.length ? files : undefined, mentionIds: mentionIds.length ? mentionIds : undefined });
    setSending(false);
    sendingRef.current = false;
  };

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/25 dark:bg-black/40 backdrop-blur-[2px] z-40 transition-opacity duration-200 ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        aria-hidden
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-full sm:max-w-[440px] md:max-w-[480px] md:top-6 md:right-6 md:bottom-6 flex flex-col z-50
          bg-[var(--msg-bg-panel)] border-l border-[var(--msg-border)]
          md:rounded-2xl md:shadow-[var(--msg-shadow-md)]
          transition-transform duration-300 ease-out overflow-hidden
          ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="px-5 sm:px-6 py-4 border-b border-[var(--msg-border)] flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--msg-radius-sm)] bg-[var(--msg-accent)] flex items-center justify-center text-white shadow-sm">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--msg-text-primary)] m-0">{t('messagerie.newMessage')}</p>
                <p className="text-[11px] text-[var(--msg-text-muted)] m-0">{t('messagerie.internalMessage')}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-[var(--msg-radius-sm)] text-[var(--msg-text-muted)] hover:bg-[var(--msg-bg-list-hover)] hover:text-[var(--msg-text-primary)] transition-colors" aria-label="Fermer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 sm:px-6 py-4 border-b border-[var(--msg-border-subtle)]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)] mb-2">{t('messagerie.destinataireLabel')}</label>
            {dest ? (
              <div className="flex items-center gap-3 p-3 rounded-[var(--msg-radius-sm)] bg-[var(--msg-bg-list)] border border-[var(--msg-border)]">
                <Av p={dest.prenom} n={dest.nom} size={36} online={dest.online}/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--msg-text-primary)] m-0">{dest.prenom} {dest.nom}</p>
                  <p className="text-xs text-[var(--msg-text-muted)] m-0">{dest.role}</p>
                </div>
                {!replyTo && (
                  <button type="button" onClick={() => setDestId("")} className="text-xs text-[var(--msg-text-muted)] hover:text-[var(--msg-accent)] hover:underline underline-offset-1 transition-colors">
                    {t('messagerie.changeRecipient')}
                  </button>
                )}
              </div>
            ) : (
              <>
                <select
                  value={destId}
                  onChange={(e) => setDestId(e.target.value)}
                  disabled={usersLoading || USERS.length === 0}
                  className="w-full px-4 py-3 rounded-[var(--msg-radius-sm)] border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] text-[var(--msg-text-primary)] text-sm min-h-[44px] outline-none focus:ring-2 focus:ring-[var(--msg-accent)]/25 focus:border-[var(--msg-accent)]/50 transition-shadow"
                >
                  <option value="">
                    {usersLoading ? t('messagerie.loadingUsers') : USERS.length === 0 ? t('messagerie.noUsersAvailable') : t('messagerie.chooseRecipient')}
                  </option>
                  {USERS.map((u) => (
                    <option key={u.id} value={String(u.id)}>{u.prenom} {u.nom}{u.role ? ` · ${u.role}` : ""}</option>
                  ))}
                </select>
                {!usersLoading && USERS.length === 0 && onRefreshUsers && (
                  <button type="button" onClick={onRefreshUsers} className="mt-2 text-xs text-gray-500 dark:text-gray-400 hover:underline underline-offset-1">
                    {t('messagerie.refreshUsers')}
                  </button>
                )}
              </>
            )}
          </div>

          <div className="px-5 sm:px-6 py-3 border-b border-[var(--msg-border-subtle)]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)] mb-1.5">{t('messagerie.sujet')}</label>
            <input value={sujet} onChange={e=>setSujet(e.target.value)} placeholder={t('messagerie.optionalSubject')}
              className="w-full border-none bg-transparent text-sm text-[var(--msg-text-primary)] outline-none placeholder:text-[var(--msg-text-muted)]"/>
          </div>

          <div className="px-5 sm:px-6 py-3 border-b border-[var(--msg-border-subtle)]">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)] mb-2">{t('messagerie.attachments')}</label>
            <input ref={fileInputRef} type="file" multiple onChange={handleFileChange} className="hidden"/>
            <button type="button" onClick={()=>fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 text-xs text-[var(--msg-text-secondary)] bg-[var(--msg-bg-list)] border border-dashed border-[var(--msg-border)] rounded-[var(--msg-radius-sm)] px-4 py-2.5 hover:bg-[var(--msg-bg-list-hover)] hover:border-[var(--msg-text-muted)]/40 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {t('messagerie.addAttachment')}
            </button>
            {files.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs text-[var(--msg-text-secondary)] bg-[var(--msg-bg-list)] rounded-[var(--msg-radius-sm)] px-2.5 py-1.5 border border-[var(--msg-border)]">
                    <span className="max-w-[140px] truncate" title={f.name}>{f.name}</span>
                    <button type="button" onClick={()=>removeFile(i)} className="p-0.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300" aria-label={t('common:delete')}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 sm:px-6 py-4 relative">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--msg-text-muted)] mb-2">{t('messagerie.message')}</label>
            <textarea ref={taRef} value={contenu} onChange={handleContenuChange} placeholder={t('messagerie.composeMessagePlaceholder')} rows={10}
              onBlur={() => setTimeout(() => setMentionOpen(false), 180)}
              className="w-full border-none bg-transparent text-sm text-[var(--msg-text-primary)] outline-none resize-none leading-relaxed placeholder:text-[var(--msg-text-muted)]"/>
            {mentionOpen && mentionCandidates.length > 0 && (
              <div className="absolute left-5 right-5 bottom-full mb-2 z-10 rounded-[var(--msg-radius)] border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] shadow-[var(--msg-shadow-md)] overflow-hidden">
                {mentionCandidates.map((u) => (
                  <button key={u.id} type="button" onMouseDown={(e) => { e.preventDefault(); insertMention(u); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-[var(--msg-text-primary)] hover:bg-[var(--msg-bg-list-hover)] transition-colors">
                    <Av p={u.prenom} n={u.nom} size={28}/>
                    <span className="flex-1 font-medium">{u.prenom} {u.nom}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">@</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 sm:px-6 py-3.5 border-t border-[var(--msg-border)] flex-shrink-0 flex items-center justify-between bg-[var(--msg-bg-list)]">
          <span className="text-[11px] text-[var(--msg-text-muted)] font-medium">
            {contenu.length > 0 ? t('messagerie.charCount', { count: contenu.length }) : t('messagerie.emptyBody')}
          </span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2.5 rounded-[var(--msg-radius-sm)] border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] text-[var(--msg-text-secondary)] text-sm font-medium hover:bg-[var(--msg-bg-list-hover)] transition-colors">
              {t('messagerie.cancel')}
            </button>
            <button type="button" onClick={handleSend} disabled={!canSend||sending}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--msg-radius-sm)] text-sm font-semibold text-white transition-all ${canSend && !sending ? "bg-[var(--msg-accent)] hover:bg-[var(--msg-accent-hover)] cursor-pointer shadow-[var(--msg-shadow-sm)]" : "bg-[var(--msg-text-muted)]/40 cursor-not-allowed"} ${sending ? "opacity-80" : ""}`}>
              {sending
                ? <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              }
              {sending ? t('messagerie.sending') : t('messagerie.send')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toast (style professionnel) ───────────────────────────────────────────────
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const id = setTimeout(onClose, 3500); return () => clearTimeout(id); }, [onClose]);
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-[var(--msg-radius)] bg-[var(--msg-text-primary)] dark:bg-slate-800 text-white text-sm font-medium shadow-[var(--msg-shadow-md)] border border-[var(--msg-border)] animate-[msg-fadeIn_0.25s_ease-out]"
      role="status"
      aria-live="polite"
    >
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      <span>{msg}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
function getRoleLabel(u: AppUser): string {
  const role = u.roles?.[0];
  if (!role) return "";
  return role.nom ?? role.code ?? "";
}

export default function MessageriePage() {
  const { t } = useTranslation("communication");
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const { messagesRecus, messagesEnvoyes } = useAppSelector((s) => s.communication);

  const [tab, setTab] = useState<"recus" | "envoyes" | "archives">("recus");
  const [selectedPeerId, setSelectedPeerId] = useState<number | null>(null);
  const [compose, setCompose] = useState(false);
  const [replyTo, setReplyTo] = useState<User | null>(null);
  const [q, setQ] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [peersForMessaging, setPeersForMessaging] = useState<Awaited<ReturnType<typeof userApi.getPeersForMessaging>>>([]);
  const [loadingPeers, setLoadingPeers] = useState(false);
  const [archivedPeerIds, setArchivedPeerIds] = useState<number[]>([]);
  const [mobileShowReader, setMobileShowReader] = useState(false);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const loadArchivedPeerIds = useCallback(() => {
    if (!authUser) return;
    messageApi.getArchivedPeerIds(authUser.id).then(setArchivedPeerIds).catch(() => setArchivedPeerIds([]));
  }, [authUser?.id]);

  const loadPeers = useCallback(() => {
    setLoadingPeers(true);
    userApi.getPeersForMessaging().then(setPeersForMessaging).catch(() => setPeersForMessaging([])).finally(() => setLoadingPeers(false));
  }, []);

  const ME = useMemo((): User | null => {
    if (!authUser) return null;
    return {
      id: authUser.id,
      prenom: authUser.prenom,
      nom: authUser.nom,
      email: authUser.email,
      role: getRoleLabel(authUser),
    };
  }, [authUser]);

  const USERS = useMemo((): User[] => {
    return peersForMessaging.map((p) => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      email: p.email,
      role: p.roleLabel,
    }));
  }, [peersForMessaging]);

  const recus = useMemo(() => messagesRecus.map(mapApiMessageToLocal), [messagesRecus]);
  const envoyes = useMemo(() => messagesEnvoyes.map(mapApiMessageToLocal), [messagesEnvoyes]);

  const archivedPeers = useMemo(
    () => USERS.filter((u) => archivedPeerIds.includes(u.id)),
    [USERS, archivedPeerIds]
  );
  const archivedFiltered = useMemo(() => {
    if (!q.trim()) return archivedPeers;
    const lq = q.toLowerCase();
    return archivedPeers.filter(
      (u) =>
        `${u.prenom} ${u.nom}`.toLowerCase().includes(lq) ||
        (u.email && u.email.toLowerCase().includes(lq)) ||
        (u.role && u.role.toLowerCase().includes(lq))
    );
  }, [archivedPeers, q]);

  const msgs = tab === "recus" ? recus : envoyes;
  const filtered = useMemo(() => {
    if (tab === "archives") return [];
    if (!q.trim()) return msgs;
    const lq = q.toLowerCase();
    return msgs.filter((m) => {
      const p = tab === "recus" ? m.expediteur : m.destinataire;
      return (
        `${p.prenom} ${p.nom}`.toLowerCase().includes(lq) ||
        m.sujet?.toLowerCase().includes(lq) ||
        m.contenu.toLowerCase().includes(lq)
      );
    });
  }, [msgs, q, tab]);

  /** Conversations : un bloc par interlocuteur (peer), messages triés par date */
  const conversations = useMemo(() => {
    if (tab === "archives" || filtered.length === 0) return [];
    const byPeer = new Map<number, { peer: User; messages: Message[] }>();
    for (const m of filtered) {
      const peer = tab === "recus" ? m.expediteur : m.destinataire;
      const existing = byPeer.get(peer.id);
      if (!existing) byPeer.set(peer.id, { peer, messages: [m] });
      else existing.messages.push(m);
    }
    const list = Array.from(byPeer.entries()).map(([peerId, { peer, messages }]) => {
      const sorted = [...messages].sort((a, b) => new Date(a.dateEnvoi).getTime() - new Date(b.dateEnvoi).getTime());
      return { peerId, peer, messages: sorted };
    });
    list.sort((a, b) => new Date(b.messages[b.messages.length - 1].dateEnvoi).getTime() - new Date(a.messages[a.messages.length - 1].dateEnvoi).getTime());
    return list;
  }, [filtered, tab]);

  const selectedConversation = useMemo(() => conversations.find((c) => c.peerId === selectedPeerId) ?? null, [conversations, selectedPeerId]);
  const selected = selectedConversation ? selectedConversation.messages[selectedConversation.messages.length - 1] : null; // dernier message pour reply/archive
  const unread = recus.filter((m) => !m.lu).length;

  useEffect(() => {
    if (!authUser) return;
    dispatch(fetchMessagesRecus({ userId: authUser.id }));
    dispatch(fetchMessagesEnvoyes({ userId: authUser.id }));
    dispatch(fetchMessagesNonLusCount(authUser.id));
    loadPeers();
    loadArchivedPeerIds();
  }, [authUser?.id, dispatch, loadPeers, loadArchivedPeerIds]);

  useEffect(() => {
    if (compose && peersForMessaging.length === 0 && authUser) loadPeers();
  }, [compose, peersForMessaging.length, authUser, loadPeers]);

  useEffect(() => { setSelectedPeerId(null); setQ(""); setMobileShowReader(false); }, [tab]);
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); searchRef.current?.focus(); }
      if ((e.metaKey || e.ctrlKey) && e.key === "n") { e.preventDefault(); setReplyTo(null); setCompose(true); }
      if (e.key === "Escape") setCompose(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const handleSelectConversation = (peerId: number) => {
    setSelectedPeerId(peerId);
    setMobileShowReader(true);
    const conv = conversations.find((c) => c.peerId === peerId);
    if (tab === "recus" && authUser && conv) {
      conv.messages.filter((m) => !m.lu).forEach((m) => dispatch(marquerMessageLu({ messageId: m.id, userId: authUser!.id })));
    }
  };

  const handleDownloadPieceJointe = useCallback(async (pieceJointeId: number, filename: string) => {
    if (!authUser) return;
    try {
      const { blob } = await messageApi.downloadPieceJointe(pieceJointeId, authUser.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // silent or toast
    }
  }, [authUser?.id]);

  const handleArchiveConversation = useCallback(async (peerUserId: number) => {
    if (!authUser) return;
    try {
      await messageApi.archiveConversation(authUser.id, peerUserId);
      loadArchivedPeerIds();
      dispatch(fetchMessagesRecus({ userId: authUser.id }));
      dispatch(fetchMessagesEnvoyes({ userId: authUser.id }));
      setSelectedPeerId(null);
      setToast(t("messagerie.conversationArchived"));
    } catch {
      setToast(t("messagerie.errorArchive"));
    }
  }, [authUser?.id, dispatch, loadArchivedPeerIds, t]);

  const handleUnarchiveConversation = useCallback(async (peerUserId: number) => {
    if (!authUser) return;
    try {
      await messageApi.unarchiveConversation(authUser.id, peerUserId);
      loadArchivedPeerIds();
      dispatch(fetchMessagesRecus({ userId: authUser.id }));
      dispatch(fetchMessagesEnvoyes({ userId: authUser.id }));
      setToast(t("messagerie.conversationUnarchived"));
    } catch {
      setToast(t("messagerie.errorUnarchive"));
    }
  }, [authUser?.id, dispatch, loadArchivedPeerIds, t]);

  const handleSuppressForMe = useCallback(async () => {
    if (!authUser || !selected) return;
    try {
      await messageApi.suppressForMe(selected.id, authUser.id);
      dispatch(fetchMessagesRecus({ userId: authUser.id }));
      dispatch(fetchMessagesEnvoyes({ userId: authUser.id }));
      setSelectedPeerId(null);
      setToast(t("messagerie.messageHiddenForMe"));
    } catch {
      setToast(t("messagerie.errorSuppressForMe"));
    }
  }, [authUser?.id, selected, dispatch, t]);

  const handleSend = ({ destId, sujet, contenu, files, mentionIds }: { destId: string; sujet: string; contenu: string; files?: File[]; mentionIds?: number[] }) => {
    const dest = USERS.find((u) => String(u.id) === destId);
    if (!dest || !authUser) return;
    dispatch(
      envoyerMessage({
        expediteurId: authUser.id,
        request: { destinataireId: Number(destId), sujet: sujet || undefined, contenu, mentionIds },
        files,
      })
    );
    setCompose(false);
    setReplyTo(null);
    setToast(t("messagerie.sentTo", { name: `${dest.prenom} ${dest.nom}` }));
  };

  if (!authUser) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-slate-500">{t("messagerie.loading")}</p>
      </div>
    );
  }

  if (!ME) return null;

  const showListOnMobile = !selected || !mobileShowReader;
  const showReaderOnMobile = selected && mobileShowReader;

  return (
    <div className="flex flex-col min-h-0 flex-1 overflow-hidden bg-[var(--mika-bg-content)]">
      <div className="flex-1 min-h-0 flex flex-col rounded-xl md:rounded-2xl border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] shadow-[var(--msg-shadow-sm)] overflow-hidden">
        <header className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[var(--msg-border)] bg-[var(--msg-bg-panel)]">
          <div className="flex items-center gap-3 min-w-0">
            {selected && (
              <button
                type="button"
                onClick={() => setMobileShowReader(false)}
                className="md:hidden p-2.5 -ml-1 rounded-[var(--msg-radius-sm)] text-[var(--msg-text-secondary)] hover:bg-[var(--msg-bg-list-hover)]"
                aria-label={t("messagerie.backToList")}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
            )}
            <h1 className="text-xl font-semibold text-[var(--msg-text-primary)] truncate tracking-tight">
              {t("messagerie.title")}
            </h1>
            {unread > 0 && (
              <span className="shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-md bg-[var(--msg-accent)] text-white">
                {t("messagerie.unreadCount", { count: unread })}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => { setReplyTo(null); setCompose(true); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[var(--msg-radius-sm)] bg-[var(--msg-accent)] hover:bg-[var(--msg-accent-hover)] text-white text-sm font-semibold shadow-[var(--msg-shadow-sm)] transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t("messagerie.newMessage")}
          </button>
        </header>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Rail liste — scroll uniquement dans la zone des conversations ci‑dessous */}
          <div className={`flex flex-col w-full md:w-[320px] lg:w-[360px] flex-shrink-0 min-h-0 overflow-hidden bg-[var(--msg-bg-list)] border-r border-[var(--msg-border)] ${showListOnMobile ? "flex" : "hidden md:flex"}`}>

            <div className="flex-shrink-0 p-3 sm:p-4">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--msg-text-muted)] pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  ref={searchRef}
                  value={q}
                  onChange={e=>setQ(e.target.value)}
                  placeholder={t("messagerie.searchPlaceholder")}
                  className="w-full pl-10 pr-10 py-3 rounded-[var(--msg-radius-sm)] border border-[var(--msg-border)] bg-[var(--msg-bg-panel)] text-[var(--msg-text-primary)] text-sm outline-none focus:ring-2 focus:ring-[var(--msg-accent)]/20 focus:border-[var(--msg-accent)]/50 transition-shadow"
                />
                {q && (
                  <button type="button" onClick={()=>setQ("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded text-[var(--msg-text-muted)] hover:text-[var(--msg-text-primary)] hover:bg-[var(--msg-bg-list-hover)]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filtres principaux (Reçus / Envoyés) + lien discret Archivés */}
            <div className="flex-shrink-0 px-3 pb-2">
              {tab === "archives" ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setTab("recus")}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[var(--msg-radius-sm)] text-sm font-medium text-[var(--msg-text-primary)] bg-[var(--msg-bg-panel)] border border-[var(--msg-border)] hover:border-[var(--msg-accent)]/40 hover:bg-[var(--msg-accent-muted)]/50 hover:text-[var(--msg-accent)] transition-all duration-200"
                    title={t("messagerie.backToList")}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    {t("messagerie.backToList")}
                  </button>
                  <span className="text-xs text-[var(--msg-text-muted)] tabular-nums">
                    {t("messagerie.tabArchives")} · {archivedPeerIds.length}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex bg-[var(--msg-bg-panel)] rounded-[var(--msg-radius-sm)] p-0.5 border border-[var(--msg-border)]">
                    {(["recus", "envoyes"] as const).map((tabKey) => {
                      const active = tab === tabKey;
                      const cnt = tabKey === "recus" ? recus.length : envoyes.length;
                      return (
                        <button
                          key={tabKey}
                          type="button"
                          onClick={() => setTab(tabKey)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all duration-200 ${active ? "bg-white dark:bg-[var(--msg-bg-list)] text-[var(--msg-accent)] shadow-sm border border-[var(--msg-border)]" : "text-[var(--msg-text-muted)] hover:text-[var(--msg-text-primary)]"}`}
                        >
                          {tabKey === "recus" ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                          )}
                          <span>{tabKey === "recus" ? t("messagerie.tabRecus") : t("messagerie.tabEnvoyes")}</span>
                          <span className={`tabular-nums text-xs font-semibold px-1.5 py-0.5 rounded ${active ? "bg-[var(--msg-accent)]/10 text-[var(--msg-accent)]" : "text-[var(--msg-text-muted)]"}`}>{cnt}</span>
                          {tabKey === "recus" && unread > 0 && (
                            <span className="min-w-[18px] h-[18px] flex items-center justify-center bg-[var(--msg-accent)] text-white text-[10px] font-bold rounded-full">{unread > 9 ? "9+" : unread}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-2 px-2.5 py-1.5 rounded-[var(--msg-radius-sm)] bg-[var(--msg-bg-panel)]/60 border border-[var(--msg-border)]/50">
                    <div className="flex-1 min-w-0">
                      {(tab === "recus" || tab === "envoyes") && (
                        <p className="text-xs text-[var(--msg-text-muted)] tabular-nums truncate font-medium">
                          {q.trim() ? t("messagerie.resultsCount", { filtered: filtered.length, total: msgs.length }) : t("messagerie.messageCount", { count: msgs.length })}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("archives")}
                      className="flex items-center gap-1.5 text-xs text-[var(--msg-text-muted)] hover:text-[var(--msg-accent)] transition-colors shrink-0 py-1"
                      title={t("messagerie.tabArchives")}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
                      <span>{t("messagerie.tabArchives")}</span>
                      {archivedPeerIds.length > 0 && (
                        <span className="tabular-nums text-[10px] font-medium px-1.5 py-0.5 rounded bg-[var(--msg-bg-list)] text-[var(--msg-text-muted)]">{archivedPeerIds.length}</span>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Barre d’info (archives uniquement) */}
            {tab === "archives" && (
              <div className="flex-shrink-0 px-3 pb-2">
                <div className="px-2.5 py-1.5 rounded-[var(--msg-radius-sm)] bg-[var(--msg-bg-panel)]/60 border border-[var(--msg-border)]/50">
                  <p className="text-xs text-[var(--msg-text-muted)] tabular-nums font-medium">
                    {t("messagerie.archivesCount", { count: archivedFiltered.length })}
                  </p>
                </div>
              </div>
            )}

            {/* Zone scrollable : seul ce bloc défile (liste des conversations) */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-1 msg-scroll">
              {tab === "archives" ? (
                archivedFiltered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                    <div className="w-12 h-12 rounded-xl bg-[var(--msg-bg-list)] border border-[var(--msg-border)] flex items-center justify-center mb-3 text-[var(--msg-text-muted)]">
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/></svg>
                    </div>
                    <p className="text-sm font-medium text-[var(--msg-text-primary)] mb-1">
                      {t("messagerie.archivesEmpty")}
                    </p>
                    <p className="text-xs text-[var(--msg-text-muted)] max-w-[220px] leading-relaxed">
                      {t("messagerie.archivesEmptyHint")}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {archivedFiltered.map((u) => (
                      <div key={u.id} className="msg-fade">
                        <ArchivedRow user={u} onUnarchive={() => handleUnarchiveConversation(u.id)} t={t} />
                      </div>
                    ))}
                  </div>
                )
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
                  <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {q ? t("messagerie.noResult") : tab === "recus" ? t("messagerie.noMessagesReceived") : t("messagerie.noMessagesSent")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 max-w-[200px] leading-relaxed">
                    {q ? t("messagerie.tryOtherTerm") : t("messagerie.messagesWillAppear")}
                  </p>
                </div>
              ) : conversations.map((conv) => (
                <div key={conv.peerId} className="msg-fade">
                  <ConvRow conv={conv} tab={tab} selected={selectedPeerId === conv.peerId} q={q} onClick={() => handleSelectConversation(conv.peerId)} users={USERS} />
                </div>
              ))}
            </div>
          </div>

          <div className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-[var(--msg-bg-panel)] ${showReaderOnMobile ? "flex" : "hidden md:flex"}`}>
            {tab === "archives" ? (
              <ArchivesPanel t={t} />
            ) : selectedConversation ? (
              <div className="msg-fade flex flex-col min-h-0 flex-1" style={{ minHeight: 0 }}>
                <Reader
                  conversation={selectedConversation}
                  tab={tab}
                  onReply={() => { setReplyTo(selectedConversation.peer); setCompose(true); }}
                  users={USERS}
                  onDownloadPieceJointe={handleDownloadPieceJointe}
                  isArchived={archivedPeerIds.includes(selectedConversation.peerId)}
                  onArchive={() => handleArchiveConversation(selectedConversation.peerId)}
                  onUnarchive={() => handleUnarchiveConversation(selectedConversation.peerId)}
                  onSuppressForMe={selected ? handleSuppressForMe : undefined}
                  t={t}
                />
              </div>
            ) : (
              <EmptyReader onCompose={()=>{ setReplyTo(null); setCompose(true); }} t={t}/>
            )}
          </div>
        </div>
      </div>

      <Compose open={compose} onClose={()=>{setCompose(false);setReplyTo(null);}} onSend={handleSend} replyTo={replyTo} users={USERS} usersLoading={loadingPeers} onRefreshUsers={loadPeers} t={t}/>
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}