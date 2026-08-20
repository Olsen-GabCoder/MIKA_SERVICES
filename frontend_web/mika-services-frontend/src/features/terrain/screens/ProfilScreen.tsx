/**
 * Profil — style réseau social : cover, avatar photo, sections plates en listes.
 * S'appuie sur le backend self-service /users/me (profil complet, photo, mot de passe, sessions).
 * Sous-vues internes : édition des informations, changement de mot de passe, appareils connectés.
 */
import { useEffect, useRef, useState } from 'react'
import type { TerrainMe } from '@/api/terrainApi'
import { userApi, type LoginHistoryEntry, type Session } from '@/api/userApi'
import type { User } from '@/types'
import { peekCachedGet } from '@/api/axios'
import { clearResponseCache } from '@/utils/responseCache'
import { useCheckForUpdate } from '@/components/pwa/PWAUpdatePrompt'
import {
  DISABLED, F, FC, HAIRLINE, HEADER_GRADIENT, ICON_MUTED, INK, INK_SOFT,
  MUTED, ORANGE, RED, SURFACE, bigBtn, errMsg, inputStyle, label13,
} from '../theme'
import { Badge, SheetSelect, Skeleton, SubHeader } from '../components/ui'
import {
  IconBriefcase, IconCamera, IconCheck, IconChevronLeft, IconChevronRight, IconClock, IconCog,
  IconKey, IconLogout, IconMail, IconMonitor, IconPen, IconPhone, IconPin, IconShield, IconX,
} from '../components/icons'
import { roleLabel } from '../me'

type Vue = 'main' | 'edit' | 'password' | 'sessions' | 'settings'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Ancienneté lisible depuis la date d'embauche. */
function anciennete(dateEmbauche?: string): string {
  if (!dateEmbauche) return '—'
  const mois = Math.floor((Date.now() - new Date(dateEmbauche).getTime()) / (1000 * 3600 * 24 * 30.44))
  if (mois < 1) return '< 1 mois'
  if (mois < 12) return `${mois} mois`
  const ans = Math.floor(mois / 12)
  return `${ans} an${ans > 1 ? 's' : ''}`
}

/** Résumé lisible d'un user-agent (appareils connectés). */
function deviceLabel(s: Session): string {
  if (s.deviceName) return s.deviceName
  const ua = s.userAgent ?? ''
  const os = /Android/i.test(ua) ? 'Android' : /iPhone|iPad|iOS/i.test(ua) ? 'iPhone / iPad'
    : /Windows/i.test(ua) ? 'Windows' : /Mac OS/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : null
  const nav = /Edg\//i.test(ua) ? 'Edge' : /Chrome\//i.test(ua) ? 'Chrome' : /Safari\//i.test(ua) ? 'Safari' : /Firefox\//i.test(ua) ? 'Firefox' : null
  return [nav, os].filter(Boolean).join(' · ') || 'Appareil inconnu'
}

// ── Briques plates (pas de cartes surélevées) ──────────────────

const sectionTitle: React.CSSProperties = {
  fontSize: 12, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '.08em',
  padding: '22px 16px 8px',
}

function Row({ Icon, label, sub, value, onClick, right, danger }: {
  Icon?: React.ComponentType<{ size?: number; strokeWidth?: number }>
  label: string
  sub?: string
  value?: string
  onClick?: () => void
  right?: React.ReactNode
  danger?: boolean
}) {
  const inner = (
    <>
      {Icon && (
        <span style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: danger ? '#FEF3F3' : SURFACE, color: danger ? RED : INK_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={19} strokeWidth={1.8} />
        </span>
      )}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: danger ? RED : INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</span>}
      </span>
      {value && <span style={{ fontSize: 13.5, color: MUTED, flexShrink: 0, maxWidth: '45%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</span>}
      {right}
      {onClick && !right && (
        <span style={{ color: ICON_MUTED, display: 'flex', flexShrink: 0 }} aria-hidden="true">
          <IconChevronRight size={18} strokeWidth={1.9} />
        </span>
      )}
    </>
  )
  const base: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', boxSizing: 'border-box',
    padding: '11px 16px', borderTop: `1px solid ${HAIRLINE}`, fontFamily: F, background: '#fff',
  }
  if (onClick) {
    return (
      <button onClick={onClick} className="tk-press" style={{ ...base, appearance: 'none', border: 'none', borderTop: `1px solid ${HAIRLINE}`, cursor: 'pointer', textAlign: 'left' }}>
        {inner}
      </button>
    )
  }
  return <div style={base}>{inner}</div>
}

// ── Écran ──────────────────────────────────────────────────────

export function ProfilScreen({ me, photoUrl, onPhotoChanged, onBack, onLogout, onToast }: {
  me: TerrainMe | null
  photoUrl: string | null
  onPhotoChanged: () => void
  onBack: () => void
  onLogout: () => Promise<void>
  onToast: (m: string, error?: boolean) => void
}) {
  const [vue, setVue] = useState<Vue>('main')
  const [busy, setBusy] = useState(false)
  // Mes chantiers : replié par défaut au-delà de 3 entrées (chefs multi-projets)
  const [chantiersDeplies, setChantiersDeplies] = useState(false)

  // Profil complet — SWR (cache immédiat, refresh en arrière-plan)
  const [full, setFull] = useState<User | null>(() => peekCachedGet<User>('/users/me'))
  useEffect(() => {
    let alive = true
    userApi.getMe().then((u) => { if (alive) setFull(u) }).catch(() => { /* offline : cache */ })
    return () => { alive = false }
  }, [])

  // Upload photo — le blob affiché est géré par le shell (partagé avec les top bars)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onPickPhoto = async (file: File) => {
    setUploading(true)
    try {
      const u = await userApi.uploadPhoto(file)
      setFull(u)
      onPhotoChanged()
      onToast('Photo de profil mise à jour')
    } catch (e) {
      onToast(errMsg(e), true)
    } finally {
      setUploading(false)
    }
  }

  const nom = full?.nom ?? me?.nom ?? ''
  const prenom = full?.prenom ?? me?.prenom ?? ''
  const email = full?.email ?? me?.email ?? ''
  const roles = full?.roles?.map((r) => r.code) ?? me?.roles ?? []
  const initiales = `${prenom.slice(0, 1)}${nom.slice(0, 1)}`.toUpperCase() || 'MK'
  const adresse = full ? [full.adresse, full.quartier, full.ville, full.province].filter(Boolean).join(', ') : ''

  if (vue === 'edit' && full) {
    return <EditVue full={full} onBack={() => setVue('main')} onSaved={(u) => { setFull(u); setVue('main'); onToast('Profil mis à jour') }} onError={(m) => onToast(m, true)} />
  }
  if (vue === 'password') {
    return <PasswordVue onBack={() => setVue('main')} onDone={() => { setVue('main'); onToast('Mot de passe modifié') }} onError={(m) => onToast(m, true)} />
  }
  if (vue === 'sessions') {
    return <SessionsVue onBack={() => setVue('main')} onToast={onToast} />
  }
  if (vue === 'settings' && full) {
    return <SettingsVue full={full} onChanged={setFull} onBack={() => setVue('main')} onToast={onToast} />
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: F }}>
      {/* Cover — dégradé charte, bouton retour flottant */}
      <div style={{ height: 128, background: HEADER_GRADIENT, position: 'relative' }}>
        <button
          onClick={onBack}
          className="tk-press"
          aria-label="Retour"
          style={{
            position: 'absolute', top: 12, left: 12, appearance: 'none', cursor: 'pointer',
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
          }}
        >
          <IconChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <span style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, background: `linear-gradient(90deg, ${ORANGE}, transparent 65%)` }} aria-hidden="true" />
      </div>

      {/* Avatar débordant + bouton photo */}
      <div style={{ padding: '0 16px', marginTop: -46, position: 'relative' }}>
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <span style={{
            width: 96, height: 96, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: SURFACE, color: INK, border: '3.5px solid #fff', boxSizing: 'border-box',
            fontFamily: FC, fontWeight: 700, fontSize: 32, overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(15,27,38,.12)', opacity: uploading ? 0.5 : 1,
          }}>
            {photoUrl ? <img src={photoUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initiales}
          </span>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="tk-press"
            aria-label="Changer la photo de profil"
            style={{
              position: 'absolute', bottom: 0, right: -2, appearance: 'none', cursor: 'pointer',
              width: 34, height: 34, borderRadius: '50%',
              background: '#fff', border: `1.5px solid ${ORANGE}`, color: ORANGE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconCamera size={17} strokeWidth={1.9} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void onPickPhoto(f); e.target.value = '' }}
          />
        </div>
      </div>

      {/* Identité */}
      <div style={{ padding: '10px 16px 0' }}>
        <div style={{ fontFamily: FC, fontSize: 26, fontWeight: 700, color: INK, lineHeight: 1.1 }}>
          {prenom} {nom}
        </div>
        <div style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>
          {[full?.matricule, email].filter(Boolean).join(' · ')}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
          {roles.map((r) => <Badge key={r} bg="#FFF0E9" fg="#C2410C">{roleLabel(r)}</Badge>)}
        </div>
      </div>

      {/* Stats — plat, séparé par des filets */}
      <div style={{ display: 'flex', margin: '16px 0 0', borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}` }}>
        {[
          { v: String(me?.chantiers.length ?? '—'), l: me?.chantiers.length === 1 ? 'Chantier' : 'Chantiers' },
          { v: String(roles.length || '—'), l: roles.length === 1 ? 'Rôle' : 'Rôles' },
          { v: anciennete(full?.dateEmbauche), l: 'Ancienneté' },
        ].map((s, i) => (
          <div key={s.l} style={{ flex: 1, textAlign: 'center', padding: '12px 4px', borderLeft: i > 0 ? `1px solid ${HAIRLINE}` : 'none' }}>
            <div style={{ fontFamily: FC, fontSize: 19, fontWeight: 700, color: INK }}>{s.v}</div>
            <div style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {full === null && <div style={{ padding: 16 }}><Skeleton height={120} /></div>}

      {/* Mes chantiers */}
      <div style={sectionTitle}>Mes chantiers</div>
      {(me?.chantiers.length ?? 0) === 0 && (
        <div style={{ padding: '10px 16px 2px', fontSize: 13.5, color: MUTED, borderTop: `1px solid ${HAIRLINE}` }}>
          Aucun chantier affecté pour le moment.
        </div>
      )}
      {(chantiersDeplies ? me?.chantiers : me?.chantiers.slice(0, 3))?.map((c) => (
        <Row key={c.id} Icon={IconPin} label={c.nom} sub={`${c.poste} · depuis le ${fmtDate(c.depuis)}`} />
      ))}
      {(me?.chantiers.length ?? 0) > 3 && (
        <button
          onClick={() => setChantiersDeplies((v) => !v)}
          className="tk-press"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '12px 16px',
            background: 'none', border: 'none', borderTop: `1px solid ${HAIRLINE}`,
            fontFamily: F, fontSize: 13.5, fontWeight: 700, color: ORANGE, cursor: 'pointer',
          }}
        >
          <span style={{ display: 'inline-flex', transform: chantiersDeplies ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'transform .15s' }}>
            <IconChevronRight size={15} strokeWidth={2} />
          </span>
          {chantiersDeplies ? 'Réduire' : `Voir les ${me!.chantiers.length} chantiers`}
        </button>
      )}

      {/* Informations */}
      {full && (
        <>
          <div style={sectionTitle}>Informations</div>
          <Row Icon={IconMail} label="Email" value={email} />
          <Row Icon={IconPhone} label="Téléphone" value={full.telephone || '—'} />
          {adresse && <Row Icon={IconPin} label="Adresse" value={adresse} />}
          {full.dateEmbauche && <Row Icon={IconBriefcase} label="Embauché le" value={fmtDate(full.dateEmbauche)} />}
          {full.departements.length > 0 && (
            <Row Icon={IconBriefcase} label={full.departements.length > 1 ? 'Départements' : 'Département'} value={full.departements.map((d) => d.nom).join(', ')} />
          )}
          {full.specialites.length > 0 && (
            <Row Icon={IconCheck} label={full.specialites.length > 1 ? 'Spécialités' : 'Spécialité'} value={full.specialites.map((s) => s.nom).join(', ')} />
          )}
          {full.superieurHierarchique && (
            <Row Icon={IconBriefcase} label="Supérieur hiérarchique" value={`${full.superieurHierarchique.prenom} ${full.superieurHierarchique.nom}`} />
          )}
          {full.lastLogin && <Row Icon={IconClock} label="Dernière connexion" value={fmtDateTime(full.lastLogin)} />}
        </>
      )}

      {/* Compte & sécurité */}
      <div style={sectionTitle}>Compte &amp; sécurité</div>
      <Row Icon={IconPen} label="Modifier mes informations" sub="Téléphone, adresse…" onClick={full ? () => setVue('edit') : undefined} />
      <Row Icon={IconKey} label="Changer le mot de passe" onClick={() => setVue('password')} />
      <Row Icon={IconMonitor} label="Appareils connectés" sub="Sessions actives et historique" onClick={() => setVue('sessions')} />
      <Row Icon={IconCog} label="Paramètres" sub="Notifications, alertes e-mail…" onClick={full ? () => setVue('settings') : undefined} />
      <Row
        Icon={IconShield}
        label="Double authentification"
        right={full?.totpEnabled
          ? <Badge bg="#E8F7EE" fg="#137A3D">Activée</Badge>
          : <Badge bg="#EEF1F4" fg="#5B6B79">Désactivée</Badge>}
        sub={full?.totpEnabled ? undefined : 'Gérable depuis la plateforme web'}
      />

      {/* Déconnexion */}
      <div style={{ height: 10 }} />
      <Row
        Icon={IconLogout}
        label={busy ? 'Déconnexion…' : 'Se déconnecter'}
        danger
        onClick={busy ? undefined : () => { setBusy(true); void onLogout().finally(() => setBusy(false)) }}
      />
      <div style={{ borderTop: `1px solid ${HAIRLINE}`, padding: '18px 16px 34px', fontSize: 12, color: MUTED, textAlign: 'center' }}>
        MIKA Services — Application terrain
      </div>
    </div>
  )
}

// ── Sous-vue : édition des informations ────────────────────────

function EditVue({ full, onBack, onSaved, onError }: {
  full: User
  onBack: () => void
  onSaved: (u: User) => void
  onError: (m: string) => void
}) {
  const [form, setForm] = useState({
    prenom: full.prenom, nom: full.nom,
    telephone: full.telephone ?? '', adresse: full.adresse ?? '',
    quartier: full.quartier ?? '', ville: full.ville ?? '', province: full.province ?? '',
  })
  const [busy, setBusy] = useState(false)
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))
  const valid = form.prenom.trim() !== '' && form.nom.trim() !== ''

  const save = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      const u = await userApi.updateMyProfile({
        nom: form.nom.trim(), prenom: form.prenom.trim(), email: full.email,
        telephone: form.telephone.trim() || undefined,
        adresse: form.adresse.trim() || undefined,
        quartier: form.quartier.trim() || undefined,
        ville: form.ville.trim() || undefined,
        province: form.province.trim() || undefined,
      })
      onSaved(u)
    } catch (e) {
      onError(errMsg(e))
      setBusy(false)
    }
  }

  const champs: { k: keyof typeof form; label: string; type?: string }[] = [
    { k: 'prenom', label: 'Prénom' },
    { k: 'nom', label: 'Nom' },
    { k: 'telephone', label: 'Téléphone', type: 'tel' },
    { k: 'adresse', label: 'Adresse' },
    { k: 'quartier', label: 'Quartier' },
    { k: 'ville', label: 'Ville' },
    { k: 'province', label: 'Province' },
  ]

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <SubHeader titre="Mes informations" onBack={onBack} />
      <div style={{ padding: '18px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F }}>
        <div>
          <label style={label13}>Email (non modifiable ici)</label>
          <input value={full.email} disabled style={{ ...inputStyle, background: SURFACE, color: MUTED }} />
        </div>
        {champs.map((c) => (
          <div key={c.k}>
            <label style={label13}>{c.label}</label>
            <input value={form[c.k]} onChange={set(c.k)} type={c.type ?? 'text'} style={inputStyle} />
          </div>
        ))}
        <button onClick={() => void save()} disabled={!valid || busy} className="tk-press" style={bigBtn(valid && !busy ? ORANGE : DISABLED)}>
          {busy ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

// ── Sous-vue : changement de mot de passe ──────────────────────

function PasswordVue({ onBack, onDone, onError }: {
  onBack: () => void
  onDone: () => void
  onError: (m: string) => void
}) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const mismatch = confirm !== '' && next !== confirm
  const valid = current !== '' && next.length >= 8 && next === confirm

  const save = async () => {
    if (!valid || busy) return
    setBusy(true)
    try {
      await userApi.changeMyPassword({ currentPassword: current, newPassword: next })
      onDone()
    } catch (e) {
      onError(errMsg(e))
      setBusy(false)
    }
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <SubHeader titre="Mot de passe" onBack={onBack} />
      <div style={{ padding: '18px 16px 32px', display: 'flex', flexDirection: 'column', gap: 14, fontFamily: F }}>
        <div>
          <label style={label13}>Mot de passe actuel</label>
          <input value={current} onChange={(e) => setCurrent(e.target.value)} type={show ? 'text' : 'password'} autoComplete="current-password" style={inputStyle} />
        </div>
        <div>
          <label style={label13}>Nouveau mot de passe (8 caractères min.)</label>
          <input value={next} onChange={(e) => setNext(e.target.value)} type={show ? 'text' : 'password'} autoComplete="new-password" style={inputStyle} />
        </div>
        <div>
          <label style={label13}>Confirmer le nouveau mot de passe</label>
          <input value={confirm} onChange={(e) => setConfirm(e.target.value)} type={show ? 'text' : 'password'} autoComplete="new-password" style={{ ...inputStyle, borderColor: mismatch ? RED : undefined }} />
          {mismatch && <div style={{ fontSize: 12.5, color: RED, marginTop: 5 }}>Les deux mots de passe ne correspondent pas.</div>}
        </div>
        <button
          onClick={() => setShow((v) => !v)}
          style={{ appearance: 'none', border: 'none', background: 'transparent', color: INK_SOFT, fontFamily: F, fontSize: 13.5, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', padding: '2px 0' }}
        >
          {show ? 'Masquer les mots de passe' : 'Afficher les mots de passe'}
        </button>
        <button onClick={() => void save()} disabled={!valid || busy} className="tk-press" style={bigBtn(valid && !busy ? ORANGE : DISABLED)}>
          {busy ? 'Modification…' : 'Modifier le mot de passe'}
        </button>
      </div>
    </div>
  )
}

// ── Sous-vue : appareils connectés + historique ────────────────

function SessionsVue({ onBack, onToast }: {
  onBack: () => void
  onToast: (m: string, error?: boolean) => void
}) {
  const [sessions, setSessions] = useState<Session[] | null>(null)
  const [history, setHistory] = useState<LoginHistoryEntry[] | null>(null)

  const load = () => {
    userApi.getMySessions().then(setSessions).catch((e) => onToast(errMsg(e), true))
    userApi.getMyLoginHistory().then(setHistory).catch(() => { /* silencieux */ })
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const revoke = async (id: number) => {
    try {
      await userApi.revokeSession(id)
      onToast('Appareil déconnecté')
      load()
    } catch (e) {
      onToast(errMsg(e), true)
    }
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: F }}>
      <SubHeader titre="Appareils connectés" onBack={onBack} />

      <div style={sectionTitle}>Sessions actives</div>
      {sessions === null && <div style={{ padding: '4px 16px' }}><Skeleton height={70} /></div>}
      {sessions !== null && sessions.length === 0 && (
        <div style={{ padding: '10px 16px', fontSize: 13.5, color: MUTED, borderTop: `1px solid ${HAIRLINE}` }}>Aucune session active.</div>
      )}
      {sessions?.map((s) => (
        <Row
          key={s.id}
          Icon={IconMonitor}
          label={deviceLabel(s)}
          sub={[s.ipAddress, s.lastActivity ? `actif le ${fmtDateTime(s.lastActivity)}` : `depuis le ${fmtDateTime(s.dateDebut)}`].filter(Boolean).join(' · ')}
          right={s.isCurrent
            ? <Badge bg="#E8F7EE" fg="#137A3D">Cet appareil</Badge>
            : (
              <button
                onClick={() => void revoke(s.id)}
                className="tk-press"
                aria-label="Déconnecter cet appareil"
                style={{ appearance: 'none', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', background: '#FEF3F3', border: '1px solid #F0B7B7', color: RED, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
              >
                <IconX size={15} strokeWidth={2.2} />
              </button>
            )}
        />
      ))}

      <div style={sectionTitle}>Dernières connexions</div>
      {history === null && <div style={{ padding: '4px 16px' }}><Skeleton height={56} /></div>}
      {history !== null && history.length === 0 && (
        <div style={{ padding: '10px 16px', fontSize: 13.5, color: MUTED, borderTop: `1px solid ${HAIRLINE}` }}>Aucune connexion enregistrée.</div>
      )}
      {history?.slice(0, 10).map((h, i) => (
        <Row
          key={`${h.createdAt}-${i}`}
          Icon={IconClock}
          label={fmtDateTime(h.createdAt)}
          sub={[h.deviceSummary, h.ipAddress].filter(Boolean).join(' · ') || undefined}
        />
      ))}
      <div style={{ height: 32 }} />
    </div>
  )
}

// ── Sous-vue : paramètres (préférences de notification) ────────

/** Interrupteur plat, style iOS, sans dépendance. */
function Toggle({ on, disabled, onChange }: { on: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      disabled={disabled}
      role="switch"
      aria-checked={on}
      style={{
        appearance: 'none', cursor: disabled ? 'default' : 'pointer', flexShrink: 0,
        width: 46, height: 27, borderRadius: 999, border: 'none', padding: 2,
        background: on ? ORANGE : '#D6DDE3', opacity: disabled ? 0.55 : 1,
        display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
        transition: 'background .15s',
      }}
    >
      <span style={{ width: 23, height: 23, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(15,27,38,.25)' }} />
    </button>
  )
}

type PrefKey = 'inAppNotificationsEnabled' | 'notificationSoundEnabled' | 'emailNotificationsEnabled' | 'alertNewLoginEnabled' | 'dailyDigestEnabled' | 'weeklyDigestEnabled'

/** Taille et nombre d'entrées du cache local des réponses GET (préfixe mika-rc-). */
function cacheStats(): { entries: number; kb: number } {
  let entries = 0
  let bytes = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith('mika-rc-') && k !== 'mika-rc-index') {
        entries++
        bytes += (localStorage.getItem(k) ?? '').length * 2
      }
    }
  } catch { /* privé / indisponible */ }
  return { entries, kb: Math.round(bytes / 1024) }
}

const SOON = <Badge bg="#EEF1F4" fg="#5B6B79">Bientôt</Badge>

function SettingsVue({ full, onChanged, onBack, onToast }: {
  full: User
  onChanged: (u: User) => void
  onBack: () => void
  onToast: (m: string, error?: boolean) => void
}) {
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [stats, setStats] = useState(() => cacheStats())
  const [updateBusy, setUpdateBusy] = useState(false)
  const { checkAndApply } = useCheckForUpdate()

  const save = async (payload: Parameters<typeof userApi.updateNotificationPreferences>[0], key: string) => {
    setBusyKey(key)
    try {
      onChanged(await userApi.updateNotificationPreferences(payload))
    } catch (e) {
      onToast(errMsg(e), true)
    } finally {
      setBusyKey(null)
    }
  }

  const saveSession = async (payload: Parameters<typeof userApi.updateSessionPreferences>[0], key: string) => {
    setBusyKey(key)
    try {
      onChanged(await userApi.updateSessionPreferences(payload))
    } catch (e) {
      onToast(errMsg(e), true)
    } finally {
      setBusyKey(null)
    }
  }

  const pref = (key: PrefKey, label: string, sub?: string) => (
    <Row
      Icon={undefined}
      label={label}
      sub={sub}
      right={<Toggle on={!!full[key]} disabled={busyKey !== null} onChange={(v) => void save({ [key]: v }, key)} />}
    />
  )

  const digestActif = !!full.dailyDigestEnabled || !!full.weeklyDigestEnabled

  return (
    <div style={{ background: '#fff', minHeight: '100vh', fontFamily: F }}>
      <SubHeader titre="Paramètres" onBack={onBack} />

      <div style={sectionTitle}>Notifications dans l&rsquo;application</div>
      {pref('inAppNotificationsEnabled', 'Notifications in-app', 'Alertes dans la cloche de l\u2019application')}
      {pref('notificationSoundEnabled', 'Son des notifications')}

      <div style={sectionTitle}>Notifications par e-mail</div>
      {pref('emailNotificationsEnabled', 'E-mails d\u2019activité', 'Événements importants vous concernant')}
      {pref('alertNewLoginEnabled', 'Alerte nouvelle connexion', 'E-mail si un nouvel appareil se connecte')}

      <div style={sectionTitle}>Résumés périodiques</div>
      {pref('dailyDigestEnabled', 'Résumé quotidien')}
      {pref('weeklyDigestEnabled', 'Résumé hebdomadaire')}
      {digestActif && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: `1px solid ${HAIRLINE}` }}>
          <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600, color: INK }}>Heure d&rsquo;envoi</span>
          <input
            type="time"
            value={full.digestTime ?? '08:00'}
            disabled={busyKey !== null}
            onChange={(e) => { if (e.target.value) void save({ digestTime: e.target.value }, 'digestTime') }}
            style={{ ...inputStyle, width: 110, padding: '8px 10px' }}
          />
        </div>
      )}

      <div style={sectionTitle}>Session &amp; sécurité</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderTop: `1px solid ${HAIRLINE}` }}>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 600, color: INK }}>Durée de session</span>
          <span style={{ display: 'block', fontSize: 12.5, color: MUTED, marginTop: 1 }}>Avant expiration de la connexion</span>
        </span>
        <SheetSelect
          value={full.defaultSessionDuration ?? ''}
          disabled={busyKey !== null}
          onChange={(v) => void saveSession({ defaultSessionDuration: v === '' ? null : (v as 'SHORT' | 'LONG') }, 'sessionDuration')}
          placeholder="Par défaut"
          title="Durée de session"
          options={[
            { value: '', label: 'Par défaut' },
            { value: 'SHORT', label: 'Courte' },
            { value: 'LONG', label: 'Longue' },
          ]}
          style={{ width: 140, flexShrink: 0 }}
        />
      </div>
      <Row
        label="Déconnexion à la fermeture"
        sub="Se déconnecter en quittant le navigateur"
        right={<Toggle on={!!full.logoutOnBrowserClose} disabled={busyKey !== null} onChange={(v) => void saveSession({ logoutOnBrowserClose: v }, 'logoutOnClose')} />}
      />

      <div style={sectionTitle}>Données &amp; hors-ligne</div>
      <Row
        label="Cache local"
        sub="Données consultables hors connexion"
        value={`${stats.entries} élément${stats.entries > 1 ? 's' : ''} · ${stats.kb} Ko`}
      />
      <Row
        label="Vider le cache local"
        sub="Les actions en attente de synchronisation sont conservées"
        onClick={() => {
          clearResponseCache()
          setStats(cacheStats())
          onToast('Cache local vidé')
        }}
      />

      <div style={sectionTitle}>Application</div>
      <Row
        label={updateBusy ? 'Vérification…' : 'Rechercher une mise à jour'}
        sub={'Installer la dernière version de l\u2019application'}
        onClick={updateBusy ? undefined : () => {
          setUpdateBusy(true)
          void checkAndApply()
            .then((r) => onToast(r === 'updated' ? 'Mise à jour installée — rechargement…' : 'Vous êtes à jour'))
            .catch(() => onToast('Vérification impossible', true))
            .finally(() => setUpdateBusy(false))
        }}
      />
      <Row label="Langue" sub="Français / English" right={SOON} />
      <Row label="Mode sombre" right={SOON} />
      <Row label="Économie de données" sub="Ne pas charger les photos sur réseau mobile" right={SOON} />

      <div style={{ borderTop: `1px solid ${HAIRLINE}`, marginTop: 22, padding: '14px 16px 34px', fontSize: 12.5, color: MUTED }}>
        Ces préférences sont synchronisées avec votre compte et s&rsquo;appliquent aussi sur la plateforme web.
      </div>
    </div>
  )
}
