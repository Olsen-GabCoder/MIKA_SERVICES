import React, { useState, useMemo, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

// ── Types ────────────────────────────────────────────────────────────────
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
interface Conversation { peerId: number; peer: User; messages: Message[] }

function mapUserMinimal(u: UserMinimal, role = ""): User {
  return { id: u.id, prenom: u.prenom, nom: u.nom, email: u.email, role };
}
function mapApiMessageToLocal(m: ApiMessage): Message {
  return { id: m.id, lu: m.lu, dateEnvoi: m.dateEnvoi, sujet: m.sujet ?? null, contenu: m.contenu, expediteur: mapUserMinimal(m.expediteur), destinataire: mapUserMinimal(m.destinataire), parentId: m.parentId ?? null, piecesJointes: m.piecesJointes, mentions: m.mentions, createdAt: m.createdAt ?? "", updatedAt: m.updatedAt ?? "" };
}

// ── Utils ─────────────────────────────────────────────────────────────────
const GRADS = [
  ["#7C3AED","#4F46E5"],["#0EA5E9","#0284C7"],["#10B981","#059669"],
  ["#F97316","#EA580C"],["#EC4899","#DB2777"],["#6366F1","#4338CA"],
  ["#14B8A6","#0D9488"],["#8B5CF6","#7C3AED"],
];
function avatarGrad(name: string): [string,string] {
  let h=0; for(let i=0;i<name.length;i++) h=(h*31+name.charCodeAt(i))&0xffff;
  return GRADS[h%GRADS.length] as [string,string];
}
function initials(p?:string,n?:string){return `${p?.[0]??''}${n?.[0]??''}`.toUpperCase()}

function renderMentions(contenu:string, mentions?:{id:number;prenom:string;nom:string}[]): React.ReactNode {
  if(!mentions?.length) return contenu;
  const pats=mentions.map(m=>`@${m.prenom.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")} ${m.nom.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}`);
  const re=new RegExp(`(${pats.join("|")})`,"g");
  return contenu.split(re).map((part,i)=>{
    const mt=mentions.find(m=>part===`@${m.prenom} ${m.nom}`);
    return mt ? <span key={i} className="font-semibold px-0.5 rounded bg-white/20">{part}</span> : <span key={i}>{part}</span>;
  });
}

function relTime(iso:string):string {
  const d=Date.now()-new Date(iso).getTime();
  const m=Math.floor(d/60000),h=Math.floor(d/3600000),dd=Math.floor(d/86400000);
  if(m<1)return"À l'instant";if(m<60)return`${m} min`;if(h<24)return`${h}h`;
  if(dd===1)return"Hier";if(dd<7)return new Date(iso).toLocaleDateString('fr-FR',{weekday:'short'});
  return new Date(iso).toLocaleDateString('fr-FR',{day:'2-digit',month:'short'});
}
function clockTime(iso:string){return new Date(iso).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
function dateLabel(iso:string):string {
  const d=new Date(iso),now=new Date();
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const msgDay=new Date(d.getFullYear(),d.getMonth(),d.getDate());
  const diff=(today.getTime()-msgDay.getTime())/86400000;
  if(diff===0)return"Aujourd'hui";if(diff===1)return"Hier";
  if(diff<7)return d.toLocaleDateString('fr-FR',{weekday:'long'});
  return d.toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
}
function sameDay(a:string,b:string){const da=new Date(a),db=new Date(b);return da.getFullYear()===db.getFullYear()&&da.getMonth()===db.getMonth()&&da.getDate()===db.getDate()}

// ── Avatar ───────────────────────────────────────────────────────────────
function Av({p,n,size=40,online}:{p?:string;n?:string;size?:number;online?:boolean}){
  const[c1,c2]=avatarGrad((p??'')+(n??''));
  return(
    <div className="relative flex-shrink-0 inline-flex">
      <div className="flex items-center justify-center rounded-full font-bold text-white shadow-sm"
        style={{width:size,height:size,minWidth:size,fontSize:Math.round(size*.36),letterSpacing:'.04em',background:`linear-gradient(135deg,${c1},${c2})`}}>
        {initials(p,n)}
      </div>
      {online&&<span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />}
    </div>
  );
}

// ── Highlight ────────────────────────────────────────────────────────────
function Hi({text,q}:{text:string;q:string}){
  if(!q.trim())return<>{text}</>;
  return<>{text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`,'gi')).map((p,i)=>
    p.toLowerCase()===q.toLowerCase()?<mark key={i} className="bg-amber-200/60 dark:bg-amber-500/30 text-inherit rounded px-0.5">{p}</mark>:<span key={i}>{p}</span>
  )}</>;
}

// ── Conversation Row ─────────────────────────────────────────────────────
function ConvRow({conv,selected,q,onClick,meId}:{conv:Conversation;selected:boolean;q:string;onClick:()=>void;meId:number}){
  const{peer,messages}=conv;
  const last=messages[messages.length-1];
  const unread=messages.filter(m=>!m.lu&&m.destinataire.id===meId).length;
  const mine=last.expediteur.id===meId;

  return(
    <button type="button" onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3 transition-all duration-150 border-l-[3px]
        ${selected
          ? "border-l-[var(--msg-accent)] bg-[var(--msg-accent)]/5 dark:bg-[var(--msg-accent)]/10"
          : "border-l-transparent hover:bg-gray-50 dark:hover:bg-white/5"}`}>
      <div className="relative flex-shrink-0">
        <Av p={peer.prenom} n={peer.nom} size={44} online={peer.online}/>
        {unread>0&&<span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-[var(--msg-accent)] text-white text-[10px] font-bold rounded-full px-1 shadow-sm">{unread>9?"9+":unread}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className={`text-[13.5px] truncate leading-tight ${unread>0?"font-bold text-gray-900 dark:text-white":"font-medium text-gray-700 dark:text-gray-200"}`}>
            <Hi text={`${peer.prenom} ${peer.nom}`} q={q}/>
          </span>
          <span className={`text-[11px] tabular-nums flex-shrink-0 ${unread>0?"text-[var(--msg-accent)] font-semibold":"text-gray-400 dark:text-gray-500"}`}>
              {relTime(last.dateEnvoi)}
          </span>
        </div>
        <p className={`text-[12.5px] leading-snug truncate m-0 ${unread>0?"text-gray-600 dark:text-gray-300":"text-gray-400 dark:text-gray-500"}`}>
          {mine&&<span className="text-[var(--msg-accent)] font-medium">Vous : </span>}
          <Hi text={last.contenu.replace(/\n/g," ").slice(0,80)} q={q}/>
        </p>
      </div>
    </button>
  );
}

// ── Date Separator ───────────────────────────────────────────────────────
function DateSep({date}:{date:string}){
  return(
    <div className="flex items-center gap-3 py-4 select-none">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{dateLabel(date)}</span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700"/>
    </div>
  );
}

// ── Read Receipt ─────────────────────────────────────────────────────────
function Receipt({lu}:{lu:boolean}){
  return(
    <svg width="16" height="11" viewBox="0 0 16 11" fill="none" className={`inline ml-1 flex-shrink-0 ${lu?"text-emerald-300":"text-white/40"}`}>
      <path d="M1 5.5L4.5 9L11 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {lu&&<path d="M5 5.5L8.5 9L15 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>}
    </svg>
  );
}

// ── Chat Bubble ──────────────────────────────────────────────────────────
const MSG_TRUNCATE_LEN = 280;
const MSG_TRUNCATE_LINES = 8;

function Bubble({msg,isMine,isFirst,isLast,onDlPJ}:{msg:Message;isMine:boolean;isFirst:boolean;isLast:boolean;onDlPJ:(id:number,name:string)=>void}){
  const hasPJ=(msg.piecesJointes?.length??0)>0;
  const isLong=msg.contenu.length>MSG_TRUNCATE_LEN||msg.contenu.split("\n").length>MSG_TRUNCATE_LINES;
  const[expanded,setExpanded]=useState(false);

  const radiusSent  = isLast?"20px 6px 20px 20px":"20px 6px 6px 20px";
  const radiusRecv  = isLast?"6px 20px 20px 20px":"6px 20px 20px 6px";

  const displayText=useMemo(()=>{
    if(!isLong||expanded)return msg.contenu;
    const lines=msg.contenu.split("\n");
    if(lines.length>MSG_TRUNCATE_LINES)return lines.slice(0,MSG_TRUNCATE_LINES).join("\n")+"…";
    return msg.contenu.slice(0,MSG_TRUNCATE_LEN)+"…";
  },[msg.contenu,isLong,expanded]);

  return(
    <div className={`msg-bubble-in flex ${isMine?"justify-end pl-6 sm:pl-12":"justify-start pr-6 sm:pr-12"} ${isFirst?"mt-3":"mt-[3px]"}`}>
      <div className="max-w-[88%] sm:max-w-[75%] lg:max-w-[65%] relative group">
        {msg.sujet&&isFirst&&(
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1.5 px-1 ${isMine?"text-right":"text-left"} text-gray-400 dark:text-gray-500`}>
            {msg.sujet}
          </p>
        )}
        <div
          style={{borderRadius: isMine?radiusSent:radiusRecv}}
          className={`relative px-3.5 py-2 shadow-sm ${
            isMine
              ? "bg-gradient-to-br from-[var(--msg-accent)] to-[color-mix(in_srgb,var(--msg-accent),#000_12%)] text-white"
              : "bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 ring-1 ring-gray-200/80 dark:ring-gray-700/80"
          }`}
        >
          <p className="text-[14px] leading-[1.6] whitespace-pre-wrap break-words">{renderMentions(displayText,msg.mentions)}</p>

          {isLong&&(
            <button type="button" onClick={()=>setExpanded(e=>!e)}
              className={`text-[12px] font-semibold mt-0.5 transition-colors ${
                isMine
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--msg-accent)] hover:text-[var(--msg-accent-hover,var(--msg-accent))]"
              }`}>
              {expanded?"Réduire ▲":"Voir plus ▼"}
            </button>
          )}

          {hasPJ&&(
            <div className={`mt-2 pt-2 flex flex-wrap gap-1.5 border-t ${isMine?"border-white/15":"border-gray-100 dark:border-gray-700"}`}>
              {msg.piecesJointes!.map(pj=>(
                <button key={pj.id} type="button" onClick={()=>onDlPJ(pj.id,pj.nomOriginal)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                    isMine?"bg-white/15 hover:bg-white/25 text-white":"bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  <span className="max-w-[100px] truncate">{pj.nomOriginal}</span>
                </button>
              ))}
              </div>
          )}

          <div className="flex items-center gap-0.5 mt-1 justify-end">
            <span className={`text-[10px] tabular-nums leading-none ${isMine?"text-white/50":"text-gray-400 dark:text-gray-500"}`}>
              {clockTime(msg.dateEnvoi)}
            </span>
            {isMine&&<Receipt lu={msg.lu}/>}
              </div>
            </div>
          </div>
    </div>
  );
}

// ── Chat Input ───────────────────────────────────────────────────────────
function ChatInput({onSend,disabled,t}:{onSend:(c:string,f?:File[])=>void;disabled?:boolean;t:(k:string)=>string}){
  const[text,setText]=useState("");
  const[files,setFiles]=useState<File[]>([]);
  const taRef=useRef<HTMLTextAreaElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  const autoResize=()=>{const ta=taRef.current;if(!ta)return;ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,120)+"px"};
  useEffect(autoResize,[text]);

  const send=()=>{
    if(!text.trim()&&files.length===0)return;
    onSend(text,files.length?files:undefined);
    setText("");setFiles([]);
    setTimeout(()=>{taRef.current?.focus();autoResize()},50);
  };
  const onKey=(e:React.KeyboardEvent)=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send()}};

  return(
    <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 sm:px-5 py-3">
      {files.length>0&&(
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {files.map((f,i)=>(
            <span key={i} className="inline-flex items-center gap-1.5 text-[11px] bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/></svg>
              <span className="max-w-[90px] truncate">{f.name}</span>
              <button type="button" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} className="hover:text-red-500 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <input ref={fileRef} type="file" multiple onChange={e=>{if(e.target.files)setFiles(p=>[...p,...Array.from(e.target.files!)]);e.target.value=""}} className="hidden"/>
        <button type="button" onClick={()=>fileRef.current?.click()} disabled={disabled}
          className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-30"
          title={t("messagerie.addAttachment")}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
        </button>
        <div className="flex-1 relative">
          <textarea ref={taRef} value={text} onChange={e=>setText(e.target.value)} onKeyDown={onKey}
            placeholder={t("messagerie.composeMessagePlaceholder")} rows={1} disabled={disabled}
            className="w-full resize-none rounded-2xl bg-gray-100 dark:bg-gray-800 px-4 py-2.5 text-sm text-gray-800 dark:text-gray-100 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--msg-accent)]/25 transition-all disabled:opacity-30 border-0"
            style={{maxHeight:120}}/>
        </div>
        <button type="button" onClick={send} disabled={(!text.trim()&&files.length===0)||disabled}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            text.trim()||files.length>0
              ? "bg-[var(--msg-accent)] text-white shadow-lg shadow-[var(--msg-accent)]/30 hover:shadow-xl hover:scale-105 active:scale-95"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
          }`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  );
}

// ── Chat View ────────────────────────────────────────────────────────────
function ChatView({conversation,chatMessages,meId,onSend,onDlPJ,isArchived,onArchive,onUnarchive,onSuppressForMe,loadingChat,t}:{
  conversation:Conversation; chatMessages:Message[]; meId:number;
  onSend:(c:string,f?:File[])=>void; onDlPJ:(id:number,name:string)=>void;
  isArchived:boolean; onArchive:()=>void; onUnarchive:()=>void; onSuppressForMe?:()=>void;
  loadingChat:boolean; t:(k:string,o?:Record<string,string|number>)=>string;
}){
  const{peer}=conversation;
  const scrollRef=useRef<HTMLDivElement>(null);
  const[actionsOpen,setActionsOpen]=useState(false);
  const btnRef=useRef<HTMLButtonElement>(null);
  const[menuPos,setMenuPos]=useState<{top?:number;bottom?:number;right?:number;maxHeight:number}|null>(null);

  const messages=chatMessages.length>0?chatMessages:conversation.messages;

  useEffect(()=>{const el=scrollRef.current;if(el)requestAnimationFrame(()=>{el.scrollTop=el.scrollHeight})},[messages.length,peer.id]);

  useLayoutEffect(()=>{
    if(!actionsOpen||!btnRef.current){setMenuPos(null);return}
    const r=btnRef.current.getBoundingClientRect(),vh=window.innerHeight,vw=window.innerWidth;
    const below=vh-r.bottom-16,above=r.top-16;
    const showUp=below<180&&above>below;
    setMenuPos({...(showUp?{bottom:vh-r.top+4}:{top:r.bottom+4}),right:vw-r.right,maxHeight:Math.max(160,showUp?above:below)});
  },[actionsOpen]);

  const closeMenu=useCallback(()=>setActionsOpen(false),[]);
  useEffect(()=>{if(!actionsOpen)return;const h=(e:KeyboardEvent)=>{if(e.key==="Escape")closeMenu()};window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h)},[actionsOpen,closeMenu]);

  return(
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 sm:px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <Av p={peer.prenom} n={peer.nom} size={38} online={peer.online}/>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{peer.prenom} {peer.nom}</p>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{peer.role||peer.email}</p>
        </div>
        <span className="hidden sm:flex text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">{messages.length} msg</span>
            <div className="relative">
          <button ref={btnRef} type="button" onClick={()=>setActionsOpen(o=>!o)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
          {actionsOpen&&menuPos&&typeof document!=="undefined"&&createPortal(
            <>
              <div className="fixed inset-0 z-[9998]" onClick={closeMenu}/>
              <div className="fixed z-[9999] w-56 rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden" style={{top:menuPos.top,bottom:menuPos.bottom,right:menuPos.right,maxHeight:menuPos.maxHeight}} role="menu">
                <div className="py-1">
                  {isArchived?(
                    <button type="button" role="menuitem" onClick={()=>{onUnarchive();closeMenu()}} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                      {t("messagerie.unarchive")}
                        </button>
                  ):(
                    <button type="button" role="menuitem" onClick={()=>{onArchive();closeMenu()}} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
                      {t("messagerie.archive")}
                        </button>
                      )}
                  {onSuppressForMe&&(
                    <>
                      <div className="border-t border-gray-100 dark:border-gray-700"/>
                      <button type="button" role="menuitem" onClick={()=>{onSuppressForMe();closeMenu()}} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        {t("messagerie.deleteForMe")}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
            </>,document.body
              )}
        </div>
      </header>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-5 py-3 chat-area msg-scroll">
        {loadingChat?(
          <div className="flex items-center justify-center h-full">
            <svg className="animate-spin w-6 h-6 text-[var(--msg-accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                  </div>
        ):(
          <div>
            {messages.length>0&&(
              <div className="flex justify-center mb-4">
                <span className="text-[10px] text-gray-400 dark:text-gray-500 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm px-3 py-1 rounded-full">
                  {t("messagerie.messageCount",{count:messages.length})}
                    </span>
                    </div>
                  )}
            {messages.map((msg,idx)=>{
              const mine=msg.expediteur.id===meId;
              const prev=idx>0?messages[idx-1]:null;
              const next=idx<messages.length-1?messages[idx+1]:null;
              const showDate=!prev||!sameDay(prev.dateEnvoi,msg.dateEnvoi);
              const isFirst=!prev||prev.expediteur.id!==msg.expediteur.id||showDate;
              const isLast=!next||next.expediteur.id!==msg.expediteur.id||(next&&!sameDay(msg.dateEnvoi,next.dateEnvoi));
              return(
                <React.Fragment key={msg.id}>
                  {showDate&&<DateSep date={msg.dateEnvoi}/>}
                  <Bubble msg={msg} isMine={mine} isFirst={isFirst} isLast={isLast} onDlPJ={onDlPJ}/>
                </React.Fragment>
            );
          })}
        </div>
        )}
      </div>

      <ChatInput onSend={onSend} t={t}/>
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────
function EmptyChat({onCompose,t}:{onCompose:()=>void;t:(k:string)=>string}){
  return(
    <div className="flex flex-col items-center justify-center h-full select-none px-6">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{t("messagerie.noMessageSelected")}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[280px] text-center leading-relaxed mb-6">{t("messagerie.selectOrCompose")}</p>
      <button type="button" onClick={onCompose}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--msg-accent)] hover:brightness-110 text-white text-sm font-semibold shadow-lg shadow-[var(--msg-accent)]/25 transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
        {t("messagerie.newMessage")}
      </button>
    </div>
  );
}

// ── Archives Panel ───────────────────────────────────────────────────────
function ArchivesPanel({t}:{t:(k:string)=>string}){
  return(
    <div className="flex flex-col items-center justify-center h-full select-none px-6">
      <div className="w-20 h-20 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-5">
        <svg className="w-9 h-9 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/></svg>
      </div>
      <p className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">{t("messagerie.archivesTitle")}</p>
      <p className="text-sm text-gray-400 dark:text-gray-500 max-w-[300px] text-center leading-relaxed">{t("messagerie.archivesDescription")}</p>
    </div>
  );
}

function ArchivedRow({user,onUnarchive,t}:{user:User;onUnarchive:()=>void;t:(k:string)=>string}){
  return(
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-[var(--msg-accent)]/40 transition-all">
      <Av p={user.prenom} n={user.nom} size={40}/>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-800 dark:text-gray-200 truncate text-sm">{user.prenom} {user.nom}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.role||user.email}</p>
      </div>
      <button type="button" onClick={onUnarchive}
        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--msg-accent)] bg-[var(--msg-accent)]/10 hover:bg-[var(--msg-accent)] hover:text-white transition-all">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        {t("messagerie.unarchive")}
      </button>
    </div>
  );
}

// ── Compose Drawer ───────────────────────────────────────────────────────
interface ComposeProps {
  open:boolean; onClose:()=>void;
  onSend:(p:{destId:string;sujet:string;contenu:string;files?:File[];mentionIds?:number[]})=>void;
  replyTo:User|null; users:User[]; usersLoading?:boolean; onRefreshUsers?:()=>void;
  t:(k:string,o?:Record<string,string|number>)=>string;
}
function Compose({open,onClose,onSend,replyTo,users:USERS,usersLoading,onRefreshUsers:_onRefreshUsers,t}:ComposeProps){
  const[destId,setDestId]=useState("");
  const[sujet,setSujet]=useState("");
  const[contenu,setContenu]=useState("");
  const[files,setFiles]=useState<File[]>([]);
  const[mentionIds,setMentionIds]=useState<number[]>([]);
  const[mentionOpen,setMentionOpen]=useState(false);
  const[mentionQuery,setMentionQuery]=useState("");
  const[,setMentionStart]=useState(0);
  const[sending,setSending]=useState(false);
  const taRef=useRef<HTMLTextAreaElement|null>(null);
  const fileRef=useRef<HTMLInputElement|null>(null);
  const sendingRef=useRef(false);
  const snapRef=useRef({contenu:"",mentionStart:0,mentionQuery:""});

  useEffect(()=>{
    if(open){if(replyTo)setDestId(String(replyTo.id));setFiles([]);setMentionIds([]);setMentionOpen(false);setTimeout(()=>taRef.current?.focus(),200)}
    else{setDestId("");setSujet("");setContenu("");setFiles([]);setMentionIds([]);setMentionOpen(false);setSending(false);sendingRef.current=false}
  },[open,replyTo]);

  const dest=USERS.find(u=>String(u.id)===destId);
  const canSend=!!destId&&contenu.trim().length>0;

  const handleContenu=(e:React.ChangeEvent<HTMLTextAreaElement>)=>{
    const v=e.target.value,pos=e.target.selectionStart??v.length;setContenu(v);
    const before=v.slice(0,pos),at=before.lastIndexOf("@");
    if(at===-1){setMentionOpen(false);return}
    const q=before.slice(at+1);
    if(q.includes(" ")||q.length>30){setMentionOpen(false);return}
    setMentionQuery(q);setMentionStart(at);setMentionOpen(true);
    snapRef.current={contenu:v,mentionStart:at,mentionQuery:q};
  };
  const mentionCandidates=USERS.filter(u=>String(u.id)!==destId&&`${u.prenom} ${u.nom}`.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0,6);
  const insertMention=(u:User)=>{
    const s=snapRef.current,before=s.contenu.slice(0,s.mentionStart),after=s.contenu.slice(s.mentionStart+1+s.mentionQuery.length);
    const ins=`@${u.prenom} ${u.nom} `,nc=before+ins+after;
    setContenu(nc);setMentionIds(ids=>ids.includes(u.id)?ids:[...ids,u.id]);setMentionOpen(false);
    snapRef.current={contenu:nc,mentionStart:s.mentionStart,mentionQuery:""};
    setTimeout(()=>{taRef.current?.focus();const p=s.mentionStart+ins.length;taRef.current?.setSelectionRange(p,p)},80);
  };
  const handleSend=()=>{
    if(!canSend||sending||sendingRef.current)return;sendingRef.current=true;setSending(true);
    onSend({destId,sujet,contenu,files:files.length?files:undefined,mentionIds:mentionIds.length?mentionIds:undefined});
    setSending(false);sendingRef.current=false;
  };

  return(
    <>
      <div onClick={onClose} className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200 ${open?"opacity-100":"opacity-0 pointer-events-none"}`}/>
      <div className={`fixed top-0 right-0 bottom-0 w-full sm:max-w-[440px] flex flex-col z-50 bg-white dark:bg-gray-900 shadow-2xl transition-transform duration-300 ease-out ${open?"translate-x-0":"translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--msg-accent)] flex items-center justify-center text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('messagerie.newMessage')}</p>
              <p className="text-[11px] text-gray-400">{t('messagerie.internalMessage')}</p>
              </div>
            </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('messagerie.destinataireLabel')}</label>
            {dest?(
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <Av p={dest.prenom} n={dest.nom} size={36} online={dest.online}/>
                <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{dest.prenom} {dest.nom}</p><p className="text-xs text-gray-400">{dest.role}</p></div>
                {!replyTo&&<button type="button" onClick={()=>setDestId("")} className="text-xs text-gray-400 hover:text-[var(--msg-accent)] transition-colors">{t('messagerie.changeRecipient')}</button>}
                </div>
            ):(
              <select value={destId} onChange={e=>setDestId(e.target.value)} disabled={usersLoading||USERS.length===0}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm outline-none focus:ring-2 focus:ring-[var(--msg-accent)]/20 transition-shadow">
                <option value="">{usersLoading?t('messagerie.loadingUsers'):USERS.length===0?t('messagerie.noUsersAvailable'):t('messagerie.chooseRecipient')}</option>
                {USERS.map(u=><option key={u.id} value={String(u.id)}>{u.prenom} {u.nom}{u.role?` · ${u.role}`:""}</option>)}
                </select>
            )}
          </div>

          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">{t('messagerie.sujet')}</label>
            <input value={sujet} onChange={e=>setSujet(e.target.value)} placeholder={t('messagerie.optionalSubject')} className="w-full border-none bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400"/>
          </div>

          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('messagerie.attachments')}</label>
            <input ref={fileRef} type="file" multiple onChange={e=>{const sel=e.target.files?Array.from(e.target.files):[];setFiles(p=>[...p,...sel]);e.target.value=""}} className="hidden"/>
            <button type="button" onClick={()=>fileRef.current?.click()} className="inline-flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2.5 hover:border-[var(--msg-accent)]/50 hover:text-[var(--msg-accent)] transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {t('messagerie.addAttachment')}
            </button>
            {files.length>0&&(
              <div className="mt-2 flex flex-wrap gap-1.5">
                {files.map((f,i)=>(
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg px-2.5 py-1.5">
                    <span className="max-w-[120px] truncate">{f.name}</span>
                    <button type="button" onClick={()=>setFiles(p=>p.filter((_,j)=>j!==i))} className="hover:text-red-500"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 relative">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('messagerie.message')}</label>
            <textarea ref={taRef} value={contenu} onChange={handleContenu} placeholder={t('messagerie.composeMessagePlaceholder')} rows={8}
              onBlur={()=>setTimeout(()=>setMentionOpen(false),180)}
              className="w-full border-none bg-transparent text-sm text-gray-800 dark:text-gray-200 outline-none resize-none leading-relaxed placeholder:text-gray-400"/>
            {mentionOpen&&mentionCandidates.length>0&&(
              <div className="absolute left-5 right-5 bottom-full mb-2 z-10 rounded-xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
                {mentionCandidates.map(u=>(
                  <button key={u.id} type="button" onMouseDown={e=>{e.preventDefault();insertMention(u)}}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-left text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <Av p={u.prenom} n={u.nom} size={26}/><span className="font-medium">{u.prenom} {u.nom}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
          <span className="text-[11px] text-gray-400 tabular-nums">{contenu.length>0?`${contenu.length} car.`:""}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">{t('messagerie.cancel')}</button>
            <button type="button" onClick={handleSend} disabled={!canSend||sending}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold text-white transition-all ${canSend&&!sending?"bg-[var(--msg-accent)] hover:brightness-110 shadow-lg shadow-[var(--msg-accent)]/25":"bg-gray-300 dark:bg-gray-600 cursor-not-allowed"}`}>
              {sending?<svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                :<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>}
              {sending?t('messagerie.sending'):t('messagerie.send')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────
function Toast({msg,onClose}:{msg:string;onClose:()=>void}){
  useEffect(()=>{const id=setTimeout(onClose,3500);return()=>clearTimeout(id)},[onClose]);
  return(
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2.5 px-5 py-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium shadow-xl animate-[msg-fadeIn_0.25s_ease-out]" role="status">
      <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      </span>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN ─────────────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
function getRoleLabel(u:AppUser):string{const r=u.roles?.[0];return r?(r.nom??r.code??""):""}

export default function MessageriePage(){
  const{t}=useTranslation("communication");
  const dispatch=useAppDispatch();
  const authUser=useAppSelector(s=>s.auth.user);
  const{messagesRecus,messagesEnvoyes}=useAppSelector(s=>s.communication);

  const[tab,setTab]=useState<"all"|"archives">("all");
  const[selectedPeerId,setSelectedPeerId]=useState<number|null>(null);
  const[compose,setCompose]=useState(false);
  const[replyTo,setReplyTo]=useState<User|null>(null);
  const[q,setQ]=useState("");
  const[toast,setToast]=useState<string|null>(null);
  const[peersForMessaging,setPeersForMessaging]=useState<Awaited<ReturnType<typeof userApi.getPeersForMessaging>>>([]);
  const[loadingPeers,setLoadingPeers]=useState(false);
  const[archivedPeerIds,setArchivedPeerIds]=useState<number[]>([]);
  const[mobileShowReader,setMobileShowReader]=useState(false);
  const[chatMessages,setChatMessages]=useState<Message[]>([]);
  const[loadingChat,setLoadingChat]=useState(false);
  const searchRef=useRef<HTMLInputElement|null>(null);

  const loadArchived=useCallback(()=>{if(!authUser)return;messageApi.getArchivedPeerIds(authUser.id).then(setArchivedPeerIds).catch(()=>setArchivedPeerIds([]))},[authUser?.id]);
  const loadPeers=useCallback(()=>{setLoadingPeers(true);userApi.getPeersForMessaging().then(setPeersForMessaging).catch(()=>setPeersForMessaging([])).finally(()=>setLoadingPeers(false))},[]);

  const ME=useMemo(():User|null=>authUser?{id:authUser.id,prenom:authUser.prenom,nom:authUser.nom,email:authUser.email,role:getRoleLabel(authUser)}:null,[authUser]);
  const USERS=useMemo(():User[]=>peersForMessaging.map(p=>({id:p.id,prenom:p.prenom,nom:p.nom,email:p.email,role:p.roleLabel})),[peersForMessaging]);

  const recus=useMemo(()=>messagesRecus.map(mapApiMessageToLocal),[messagesRecus]);
  const envoyes=useMemo(()=>messagesEnvoyes.map(mapApiMessageToLocal),[messagesEnvoyes]);

  const archivedPeers=useMemo(()=>USERS.filter(u=>archivedPeerIds.includes(u.id)),[USERS,archivedPeerIds]);
  const archivedFiltered=useMemo(()=>{if(!q.trim())return archivedPeers;const lq=q.toLowerCase();return archivedPeers.filter(u=>`${u.prenom} ${u.nom}`.toLowerCase().includes(lq))},[archivedPeers,q]);

  const conversations=useMemo(()=>{
    if(tab==="archives"||!ME)return[];
    const all=[...recus,...envoyes];
    const map=new Map<number,{peer:User;messages:Message[]}>();
    for(const m of all){
      const pid=m.expediteur.id===ME.id?m.destinataire.id:m.expediteur.id;
      const peer=m.expediteur.id===ME.id?m.destinataire:m.expediteur;
      const ex=map.get(pid);
      if(!ex)map.set(pid,{peer,messages:[m]});
      else{if(!ex.messages.find(x=>x.id===m.id))ex.messages.push(m)}
    }
    const list=Array.from(map.entries()).map(([peerId,{peer,messages}])=>{
      const sorted=[...messages].sort((a,b)=>new Date(a.dateEnvoi).getTime()-new Date(b.dateEnvoi).getTime());
      return{peerId,peer,messages:sorted}as Conversation;
    });
    list.sort((a,b)=>new Date(b.messages[b.messages.length-1].dateEnvoi).getTime()-new Date(a.messages[a.messages.length-1].dateEnvoi).getTime());
    if(!q.trim())return list;
    const lq=q.toLowerCase();
    return list.filter(c=>`${c.peer.prenom} ${c.peer.nom}`.toLowerCase().includes(lq)||c.messages.some(m=>m.contenu.toLowerCase().includes(lq)));
  },[recus,envoyes,q,tab,ME]);

  const selectedConversation=useMemo(()=>conversations.find(c=>c.peerId===selectedPeerId)??null,[conversations,selectedPeerId]);
  const unread=recus.filter(m=>!m.lu).length;

  useEffect(()=>{if(!authUser)return;dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}));dispatch(fetchMessagesNonLusCount(authUser.id));loadPeers();loadArchived()},[authUser?.id,dispatch,loadPeers,loadArchived]);
  useEffect(()=>{if(compose&&peersForMessaging.length===0&&authUser)loadPeers()},[compose,peersForMessaging.length,authUser,loadPeers]);
  useEffect(()=>{setSelectedPeerId(null);setQ("");setMobileShowReader(false);setChatMessages([])},[tab]);
  useEffect(()=>{
    const h=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key==="k"){e.preventDefault();searchRef.current?.focus()}
      if((e.metaKey||e.ctrlKey)&&e.key==="n"){e.preventDefault();setReplyTo(null);setCompose(true)}
      if(e.key==="Escape")setCompose(false);
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);

  const loadFullConversation=useCallback(async(peerId:number)=>{
    if(!authUser)return;setLoadingChat(true);
    try{const resp=await messageApi.getConversation(authUser.id,peerId,0,200);setChatMessages((resp.content??[]).map(mapApiMessageToLocal))}
    catch{setChatMessages([])}
    setLoadingChat(false);
  },[authUser?.id]);

  const handleSelect=useCallback((peerId:number)=>{
    setSelectedPeerId(peerId);setMobileShowReader(true);loadFullConversation(peerId);
    const conv=conversations.find(c=>c.peerId===peerId);
    if(authUser&&conv)conv.messages.filter(m=>!m.lu&&m.destinataire.id===authUser.id).forEach(m=>dispatch(marquerMessageLu({messageId:m.id,userId:authUser!.id})));
  },[conversations,authUser,dispatch,loadFullConversation]);

  const handleDlPJ=useCallback(async(pjId:number,name:string)=>{
    if(!authUser)return;
    try{const{blob}=await messageApi.downloadPieceJointe(pjId,authUser.id);const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}catch{}
  },[authUser?.id]);

  const handleArchive=useCallback(async(pid:number)=>{
    if(!authUser)return;
    try{await messageApi.archiveConversation(authUser.id,pid);loadArchived();dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}));setSelectedPeerId(null);setChatMessages([]);setToast(t("messagerie.conversationArchived"))}
    catch{setToast(t("messagerie.errorArchive"))}
  },[authUser?.id,dispatch,loadArchived,t]);

  const handleUnarchive=useCallback(async(pid:number)=>{
    if(!authUser)return;
    try{await messageApi.unarchiveConversation(authUser.id,pid);loadArchived();dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}));setToast(t("messagerie.conversationUnarchived"))}
    catch{setToast(t("messagerie.errorUnarchive"))}
  },[authUser?.id,dispatch,loadArchived,t]);

  const handleSuppressForMe=useCallback(async()=>{
    if(!authUser||!selectedConversation)return;
    const last=selectedConversation.messages[selectedConversation.messages.length-1];
    try{await messageApi.suppressForMe(last.id,authUser.id);dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}));setSelectedPeerId(null);setChatMessages([]);setToast(t("messagerie.messageHiddenForMe"))}
    catch{setToast(t("messagerie.errorSuppressForMe"))}
  },[authUser?.id,selectedConversation,dispatch,t]);

  const handleChatSend=useCallback(async(contenu:string,files?:File[])=>{
    if(!authUser||!selectedPeerId)return;
    try{await dispatch(envoyerMessage({expediteurId:authUser.id,request:{destinataireId:selectedPeerId,contenu},files})).unwrap();loadFullConversation(selectedPeerId);dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}))}catch{}
  },[authUser?.id,selectedPeerId,dispatch,loadFullConversation]);

  const handleComposeSend=({destId,sujet,contenu,files,mentionIds}:{destId:string;sujet:string;contenu:string;files?:File[];mentionIds?:number[]})=>{
    const dest=USERS.find(u=>String(u.id)===destId);
    if(!dest||!authUser)return;
    dispatch(envoyerMessage({expediteurId:authUser.id,request:{destinataireId:Number(destId),sujet:sujet||undefined,contenu,mentionIds},files}))
      .then(()=>{dispatch(fetchMessagesRecus({userId:authUser.id}));dispatch(fetchMessagesEnvoyes({userId:authUser.id}));setSelectedPeerId(dest.id);setMobileShowReader(true);loadFullConversation(dest.id)});
    setCompose(false);setReplyTo(null);setToast(t("messagerie.sentTo",{name:`${dest.prenom} ${dest.nom}`}));
  };

  if(!authUser||!ME)return<div className="flex flex-1 items-center justify-center p-8"><p className="text-gray-400">{t("messagerie.loading")}</p></div>;

  const showList=!selectedConversation||!mobileShowReader;
  const showChat=selectedConversation&&mobileShowReader;

  return(
    <div
      className="flex flex-col overflow-hidden rounded-2xl bg-white dark:bg-gray-900 ring-1 ring-gray-200/80 dark:ring-gray-700/60 shadow-sm"
      style={{height:'calc(100vh - var(--layout-header-height, 4.5rem) - var(--layout-footer-height, 3.5rem) - 1.5rem)'}}
    >
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ─── Sidebar ─────────────────────────────────── */}
        <div className={`flex flex-col w-full md:w-80 lg:w-[340px] xl:w-[380px] flex-shrink-0 min-h-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 ${showList?"flex":"hidden md:flex"}`}>

          {/* Sidebar header */}
          <div className="flex-shrink-0 px-4 pt-4 pb-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t("messagerie.title")}</h1>
                {unread>0&&<span className="min-w-[22px] h-[22px] flex items-center justify-center bg-[var(--msg-accent)] text-white text-[11px] font-bold rounded-full px-1.5">{unread}</span>}
          </div>
              <button type="button" onClick={()=>{setReplyTo(null);setCompose(true)}}
                className="w-9 h-9 rounded-full bg-[var(--msg-accent)] text-white flex items-center justify-center shadow-lg shadow-[var(--msg-accent)]/25 hover:brightness-110 hover:scale-105 active:scale-95 transition-all"
                title={t("messagerie.newMessage")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </button>
            </div>

            {/* Search */}
              <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input ref={searchRef} value={q} onChange={e=>setQ(e.target.value)} placeholder={t("messagerie.searchPlaceholder")}
                className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-200 outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-[var(--msg-accent)]/20 transition-all border-0"/>
              {q&&<button type="button" onClick={()=>setQ("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white hover:bg-gray-400 transition-colors">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>}
              </div>
            </div>

          {/* Tabs: conversations / archives */}
          <div className="flex-shrink-0 px-4 py-2 flex items-center justify-between">
            {tab==="archives"?(
              <button type="button" onClick={()=>setTab("all")} className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--msg-accent)] hover:underline">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                    {t("messagerie.backToList")}
                  </button>
            ):(
              <p className="text-xs font-medium text-gray-400 dark:text-gray-500">
                {conversations.length} conversation{conversations.length!==1?"s":""}
                        </p>
                      )}
            {tab!=="archives"&&(
              <button type="button" onClick={()=>setTab("archives")} className="inline-flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 hover:text-[var(--msg-accent)] transition-colors">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/></svg>
                {t("messagerie.tabArchives")}
                {archivedPeerIds.length>0&&<span className="ml-1 text-[10px] bg-gray-200 dark:bg-gray-700 px-1 rounded">{archivedPeerIds.length}</span>}
                    </button>
              )}
            </div>

          {/* Conversation list (scrollable!) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden msg-scroll">
            {tab==="archives"?(
              archivedFiltered.length===0?(
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <svg className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/></svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{t("messagerie.archivesEmpty")}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{t("messagerie.archivesEmptyHint")}</p>
                </div>
              ):(
                <div className="px-3 space-y-2 pb-3">
                  {archivedFiltered.map(u=><div key={u.id} className="msg-fade"><ArchivedRow user={u} onUnarchive={()=>handleUnarchive(u.id)} t={t}/></div>)}
                  </div>
                )
            ):conversations.length===0?(
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <svg className="w-10 h-10 text-gray-200 dark:text-gray-700 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{q?t("messagerie.noResult"):t("messagerie.noMessagesReceived")}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{q?t("messagerie.tryOtherTerm"):t("messagerie.messagesWillAppear")}</p>
                </div>
            ):(
              <div className="pb-2">
                {conversations.map(conv=>(
                <div key={conv.peerId} className="msg-fade">
                    <ConvRow conv={conv} selected={selectedPeerId===conv.peerId} q={q} onClick={()=>handleSelect(conv.peerId)} meId={ME.id}/>
                </div>
              ))}
              </div>
            )}
            </div>
          </div>

        {/* ─── Chat zone ──────────────────────────────── */}
        <div className={`flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden bg-[var(--msg-chat-bg)] ${showChat?"flex":"hidden md:flex"}`}>
          {/* Mobile back button */}
          {selectedConversation&&(
            <div className="md:hidden flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <button type="button" onClick={()=>{setMobileShowReader(false);setChatMessages([])}} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t("messagerie.backToList")}</span>
            </div>
          )}
          {tab==="archives"?(
            <ArchivesPanel t={t}/>
          ):selectedConversation?(
            <ChatView
              conversation={selectedConversation} chatMessages={chatMessages} meId={ME.id}
              onSend={handleChatSend} onDlPJ={handleDlPJ}
                  isArchived={archivedPeerIds.includes(selectedConversation.peerId)}
              onArchive={()=>handleArchive(selectedConversation.peerId)}
              onUnarchive={()=>handleUnarchive(selectedConversation.peerId)}
              onSuppressForMe={handleSuppressForMe}
              loadingChat={loadingChat} t={t}
            />
          ):(
            <EmptyChat onCompose={()=>{setReplyTo(null);setCompose(true)}} t={t}/>
          )}
        </div>
      </div>

      <Compose open={compose} onClose={()=>{setCompose(false);setReplyTo(null)}} onSend={handleComposeSend} replyTo={replyTo} users={USERS} usersLoading={loadingPeers} onRefreshUsers={loadPeers} t={t}/>
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
