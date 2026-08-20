/**
 * Écran de connexion dédié à l'app mobile terrain.
 * Mêmes comptes que le web, mais session longue (rememberMe) et design plein écran mobile.
 */
import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, verify2FA, clearTwoFactorPending } from '@/store/slices/authSlice'
import { useIsOnline } from '@/hooks/useConnectivity'
import { DISABLED, F, FC, HAIRLINE, INK, INK_SOFT, MUTED, ORANGE, RED, bigBtn, errMsg, inputStyle, label13 } from '../theme'
import { IconAlert, IconCloudOff, IconEye, IconEyeOff } from '../components/icons'

const ERROR_LABELS: Record<string, string> = {
  RATE_LIMIT: 'Trop de tentatives. Réessayez dans quelques minutes.',
  ACCOUNT_LOCKED: 'Compte temporairement verrouillé. Réessayez plus tard.',
}

export function TerrainLoginScreen() {
  const dispatch = useAppDispatch()
  const online = useIsOnline()
  const twoFactorPending = useAppSelector((s) => s.auth.twoFactorPending)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const valide = email.trim() !== '' && password !== ''

  const submitLogin = async () => {
    if (!valide || busy) return
    setBusy(true)
    setError(null)
    try {
      const result = await dispatch(login({ email: email.trim(), password, rememberMe: true }))
      if (login.rejected.match(result)) {
        const payload = result.payload as { code?: string } | undefined
        setError(ERROR_LABELS[payload?.code ?? ''] ?? 'Email ou mot de passe incorrect.')
      }
      // fulfilled : soit authentifié (le gate bascule), soit twoFactorPending (étape code)
    } catch (e) {
      setError(errMsg(e))
    } finally {
      setBusy(false)
    }
  }

  const submitCode = async () => {
    if (!twoFactorPending || code.trim().length < 6 || busy) return
    setBusy(true)
    setError(null)
    try {
      await dispatch(verify2FA({ tempToken: twoFactorPending.tempToken, code: code.trim(), rememberMe: true })).unwrap()
    } catch {
      setError('Code invalide ou expiré.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', fontFamily: F,
      background: 'linear-gradient(180deg, #FFFFFF 0%, #FDFDFE 55%, #F7F8FA 100%)',
      display: 'flex', flexDirection: 'column',
      padding: '0 24px calc(24px + env(safe-area-inset-bottom))',
      position: 'relative', overflow: 'hidden',
    }}>
      <LoginBackdrop />
      {/* Marque */}
      <div style={{ paddingTop: 'calc(56px + env(safe-area-inset-top))', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
        <img
          src="/Logo_mika_services.png"
          alt="MIKA Services"
          style={{ width: 180, maxWidth: '60vw', height: 'auto', display: 'block' }}
        />
        <div style={{ fontSize: 14, color: MUTED, fontWeight: 600 }}>Espace terrain</div>
      </div>

      {/* Formulaire */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16, maxWidth: 420, width: '100%', margin: '0 auto', paddingTop: 32, position: 'relative', zIndex: 1 }}>

        {!online && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#F4F6F8', borderRadius: 12, padding: '12px 14px', color: INK_SOFT, fontSize: 13.5, fontWeight: 600 }}>
            <IconCloudOff size={18} strokeWidth={1.9} />
            Hors ligne — la connexion nécessite le réseau.
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#FDEAEA', borderRadius: 12, padding: '12px 14px', color: RED, fontSize: 13.5, fontWeight: 600 }}>
            <IconAlert size={18} strokeWidth={1.9} />
            <span style={{ flex: 1 }}>{error}</span>
          </div>
        )}

        {!twoFactorPending ? (
          <>
            <div>
              <label style={label13}>Email</label>
              <input
                type="email"
                inputMode="email"
                autoComplete="username"
                autoCapitalize="none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom.nom@mikaservices.com"
                style={{ ...inputStyle, height: 52, fontSize: 16 }}
              />
            </div>
            <div>
              <label style={label13}>Mot de passe</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void submitLogin() }}
                  placeholder="••••••••"
                  style={{ ...inputStyle, height: 52, fontSize: 16, paddingRight: 52 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  style={{
                    position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                    appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer',
                    width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: INK_SOFT,
                  }}
                >
                  {showPassword ? <IconEyeOff size={21} strokeWidth={1.8} /> : <IconEye size={21} strokeWidth={1.8} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => void submitLogin()}
              disabled={!valide || busy || !online}
              className="tk-press"
              style={{ ...bigBtn(valide && !busy && online ? ORANGE : DISABLED), height: 54, marginTop: 4 }}
            >
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
            <div style={{ fontSize: 12.5, color: MUTED, textAlign: 'center' }}>
              Session longue durée sur cet appareil. Utilisez vos identifiants habituels.
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: FC, fontSize: 19, fontWeight: 700, color: INK }}>Vérification en deux étapes</div>
              <div style={{ fontSize: 13.5, color: MUTED, marginTop: 6 }}>
                Saisissez le code à 6 chiffres de votre application d'authentification.
              </div>
            </div>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter') void submitCode() }}
              placeholder="000000"
              style={{
                ...inputStyle, height: 56, fontSize: 24, textAlign: 'center',
                letterSpacing: '.35em', fontWeight: 700,
              }}
            />
            <button
              onClick={() => void submitCode()}
              disabled={code.trim().length < 6 || busy}
              className="tk-press"
              style={{ ...bigBtn(code.trim().length >= 6 && !busy ? ORANGE : DISABLED), height: 54 }}
            >
              {busy ? 'Vérification…' : 'Valider le code'}
            </button>
            <button
              onClick={() => { dispatch(clearTwoFactorPending()); setCode(''); setError(null) }}
              style={{
                appearance: 'none', border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: F, fontSize: 13.5, fontWeight: 700, color: INK_SOFT, padding: 10,
              }}
            >
              Revenir à la connexion
            </button>
          </>
        )}
      </div>

      {/* Pied */}
      <div style={{ borderTop: `1px solid ${HAIRLINE}`, paddingTop: 14, textAlign: 'center', fontSize: 12, color: MUTED, position: 'relative', zIndex: 1 }}>
        MIKA Services BTP — application terrain
      </div>
    </div>
  )
}

/**
 * Décor d'arrière-plan du login — purement décoratif, presque imperceptible :
 * arcs circulaires orange très pâles (haut gauche), deux trames de points qui se
 * fondent dans le blanc, et un filigrane BTP au trait (grue, bâtiment, pelleteuse).
 */
function LoginBackdrop() {
  const dots = (pos: React.CSSProperties): React.CSSProperties => ({
    position: 'absolute', ...pos,
    backgroundImage: 'radial-gradient(circle, #C9D2DA 1px, transparent 1px)',
    backgroundSize: '18px 18px',
    opacity: 0.38,
    WebkitMaskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 72%)',
    maskImage: 'radial-gradient(ellipse at center, #000 0%, transparent 72%)',
  })
  const ring = (size: number, top: number, left: number, borderColor: string, bg?: string): React.CSSProperties => ({
    position: 'absolute', width: size, height: size, top, left, borderRadius: '50%',
    border: `1.5px solid ${borderColor}`, background: bg ?? 'transparent',
  })
  return (
    <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* Couches circulaires — coin supérieur gauche, coupées par l'écran */}
      <span style={ring(340, -170, -150, 'rgba(255,107,53,.10)', 'rgba(255,107,53,.025)')} />
      <span style={ring(430, -215, -195, 'rgba(255,107,53,.07)')} />
      <span style={ring(520, -260, -240, 'rgba(255,107,53,.045)')} />

      {/* Trames de points — gauche haut/médian et droite médian/bas */}
      <span style={dots({ left: -40, top: '22%', width: 220, height: 240 })} />
      <span style={dots({ right: -50, top: '56%', width: 230, height: 250 })} />

      {/* Filigrane BTP au trait — bas de l'écran, deux plans de gris pour la profondeur */}
      <svg
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)', width: '140%', minWidth: 640, maxWidth: 960, opacity: 0.6 }}
        fill="none" strokeLinecap="round" strokeLinejoin="round"
      >
        {/* ── Plan lointain — skyline à peine visible ── */}
        <g stroke="#EBEEF2" strokeWidth="1">
          <path d="M20 200v-64h40v64M32 148v-6M48 148v-6M32 162h16M32 176h16" />
          <path d="M330 200v-52h34v52M338 158h18M338 172h18M338 186h18" />
          <path d="M436 200v-74h44v74M448 138v-8h20v8M448 152h20M448 168h20M448 184h20" />
          <path d="M726 200v-58h50v58M738 154h26M738 170h26M738 186h26" />
        </g>

        {/* ── Plan proche ── */}
        <g stroke="#D9DFE6" strokeWidth="1.1">
          {/* Ligne de sol, double filet */}
          <path d="M0 200h800" />
          <path d="M60 206h300M480 206h260" stroke="#E8ECF0" />

          {/* Pelleteuse — chenilles, tourelle, flèche articulée, godet */}
          <path d="M79 200a9 9 0 0 1 0-18h64a9 9 0 0 1 0 18z" />
          <circle cx="86" cy="191" r="3.6" /><circle cx="104" cy="191" r="3.6" /><circle cx="122" cy="191" r="3.6" /><circle cx="140" cy="191" r="3.6" />
          <path d="M92 182v-4h44v4" />
          <path d="M94 178v-16a4 4 0 0 1 4-4h30a4 4 0 0 1 4 4v16" />
          <path d="M112 158v-12a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v12M116 150h13" />
          <path d="M132 165l36-30" />
          <path d="M168 135l22 26" />
          <path d="M138 158l30-22M172 142l16 21" />
          <path d="M190 161l10 12-15 5a8 8 0 0 1 5-17z" />
          {/* Petit tas de terre */}
          <path d="M214 200q10-9 22 0" />

          {/* Grue à tour — mât en treillis, contre-flèche, flèche, chariot + charge */}
          {/* Mât */}
          <path d="M290 200V64M304 200V64" />
          <path d="M290 184h14M290 168h14M290 152h14M290 136h14M290 120h14M290 104h14M290 88h14M290 72h14" />
          <path d="M290 200l14-16M304 184l-14-16M290 168l14-16M304 152l-14-16M290 136l14-16M304 120l-14-16M290 104l14-16M304 88l-14-16" />
          {/* Cabine + porte-flèche */}
          <path d="M284 64h26v-12h-26zM297 52V30" />
          {/* Contre-flèche + contrepoids */}
          <path d="M240 58h44M240 64h44M240 58v6M248 58l8 6M260 58l8 6M272 58l8 6" />
          <path d="M238 64v14h16V64" />
          {/* Flèche en treillis */}
          <path d="M310 58h150M310 64h144M318 58l10 6M334 58l10 6M350 58l10 6M366 58l10 6M382 58l10 6M398 58l10 6M414 58l10 6M430 58l10 6M446 58l8 6" />
          <path d="M460 58l-6 6" />
          {/* Haubans depuis le porte-flèche */}
          <path d="M297 30 240 58M297 30l90 28M297 30l163 28" />
          {/* Chariot, câble, palonnier + poutre */}
          <path d="M396 64v4M392 68h8" />
          <path d="M396 72v46M388 118h16M390 118v6M402 118v6" />
          <path d="M380 128h32" strokeWidth="1.4" />

          {/* Bâtiment en construction — ossature, niveaux, attentes d'armature */}
          <path d="M560 200V96M700 200V96M595 200V96M630 200V96M665 200V96" />
          <path d="M556 96h148M556 122h148M556 148h148M556 174h148" />
          {/* Attentes (fers) au sommet */}
          <path d="M560 96v-8M595 96v-8M630 96v-8M665 96v-8M700 96v-8" stroke="#E3E8ED" />
          {/* Étage supérieur en cours — dalle partielle */}
          <path d="M556 96l-10-10h60" stroke="#E3E8ED" />
          {/* Échafaudage sur la face gauche */}
          <path d="M540 200V110M550 200V110M540 122h10M540 148h10M540 174h10M540 200l10-12M540 174l10-12M540 148l10-12" stroke="#E3E8ED" />
          {/* Personnages-silhouettes suggérés (2 traits) */}
          <path d="M612 148v-9M609 141l3-2 3 2" stroke="#E3E8ED" />
        </g>
      </svg>
    </div>
  )
}
