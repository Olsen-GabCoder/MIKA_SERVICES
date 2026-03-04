import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { login, verify2FA } from '@/store/slices/authSlice'
import { isLogin2FAPending } from '@/api/authApi'
import { LoginCanvas } from '../components/LoginCanvas'
import { LoginForm } from '../components/LoginForm'
import { Verify2FAForm } from '../components/Verify2FAForm'

const LOGO_SRC = '/Logo_mika_services.png'

export const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, twoFactorPending } = useAppSelector((state) => state.auth)
  const defaultHomePath = useAppSelector((state) => state.ui.defaultHomePath)
  const { t } = useTranslation('auth')
  const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
  const destination = user?.mustChangePassword ? '/profile' : (from === '/' ? defaultHomePath : from)

  useEffect(() => {
    if (isAuthenticated) {
      navigate(destination, { replace: true })
    }
  }, [isAuthenticated, navigate, destination])

  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    try {
      const result = await dispatch(login({ email, password, rememberMe })).unwrap()
      if (!isLogin2FAPending(result)) {
        navigate(result.user?.mustChangePassword ? '/profile' : (from === '/' ? defaultHomePath : from), { replace: true })
      }
    } catch {
      // Erreur affichée par le formulaire
    }
  }

  const handleVerify2FA = async (code: string) => {
    if (!twoFactorPending) return
    try {
      const result = await dispatch(verify2FA({ tempToken: twoFactorPending.tempToken, code, rememberMe: twoFactorPending.rememberMe })).unwrap()
      navigate(result.user?.mustChangePassword ? '/profile' : (from === '/' ? defaultHomePath : from), { replace: true })
    } catch {
      // Erreur affichée par Verify2FAForm
    }
  }

  const show2FAStep = twoFactorPending !== null

  const missions = [
    { n: '01', t: t('login.mission1Title'), d: t('login.mission1Desc') },
    { n: '02', t: t('login.mission2Title'), d: t('login.mission2Desc') },
    { n: '03', t: t('login.mission3Title'), d: t('login.mission3Desc') },
    { n: '04', t: t('login.mission4Title'), d: t('login.mission4Desc') },
    { n: '05', t: t('login.mission5Title'), d: t('login.mission5Desc') },
    { n: '06', t: t('login.mission6Title'), d: t('login.mission6Desc') },
  ]
  const tickerItems = [...missions, ...missions]

  return (
    <div className="login-page" role="main" aria-label={t('login.pageAria')}>
      <LoginCanvas />

      <div className="login-left">
        <div className="login-left-content">
          <div className="login-logo-wrap">
            <img src={LOGO_SRC} alt="MIKA Services" width={200} height={80} />
          </div>

          <h1 className="login-headline">
            {(() => {
              const headline = t('login.headline')
              const highlight = t('login.headlineHighlight')
              const parts = headline.split(highlight)
              return (
                <>
                  {parts[0]}
                  <span>{highlight}</span>
                  {parts.slice(1).join(highlight)}
                </>
              )
            })()}
          </h1>
          <p className="login-sub-line">{t('login.subLine')}</p>

          <div className="login-ticker-wrap">
            <div className="login-ticker-label">{t('login.tickerLabel')}</div>
            <div className="login-ticker-box">
              <div className="login-ticker-accent" aria-hidden="true" />
              <div className="login-ticker-inner">
                {tickerItems.map((m, i) => (
                  <div key={`${m.n}-${i}`} className="login-ticker-item">
                    <div className="login-t-num">{m.n}</div>
                    <div className="login-t-content">
                      <div className="login-t-title">{m.t}</div>
                      <div className="login-t-desc">{m.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

{/* Badge retiré pour un design plus épuré */}
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-inner">
          <div className="login-form-greeting">{t('login.formGreeting')}</div>
          <h2 className="login-form-title">
            {show2FAStep ? t('twoFa.verifyTitle') : t('login.formTitle')}
          </h2>
          <p className="login-form-sub">
            {show2FAStep ? t('twoFa.verifySubtitle') : t('login.formSub')}
          </p>

          {show2FAStep ? (
            <Verify2FAForm onSubmit={handleVerify2FA} />
          ) : (
            <LoginForm onSubmit={handleLogin} />
          )}

          {!show2FAStep && (
            <div className="login-security">
              <div className="login-sec-dot" aria-hidden="true" />
              <span className="login-sec-text">{t('login.secText')}</span>
            </div>
          )}

          <p className="login-form-footer">{t('footer')}</p>
        </div>
      </div>
    </div>
  )
}
