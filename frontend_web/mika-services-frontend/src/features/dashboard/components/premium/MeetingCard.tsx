import { useTranslation } from 'react-i18next'
import { useFormatDate } from '@/hooks/useFormatDate'
import type { ReunionHebdoSummary } from '@/types/reunionHebdo'

export interface MeetingCardProps {
  data: ReunionHebdoSummary | null
  loading?: boolean
}

export function MeetingCard({ data, loading = false }: MeetingCardProps) {
  const { t } = useTranslation('common')
  const formatDate = useFormatDate()

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-4 rounded-xl p-4 animate-pulse" style={{ background: 'var(--db-card)' }}>
        <div className="h-4 w-24 rounded mb-4" style={{ background: 'var(--db-subtle)' }} />
        <div className="h-10 w-20 rounded mb-2" style={{ background: 'var(--db-subtle)' }} />
        <div className="h-3 w-32 rounded" style={{ background: 'var(--db-subtle)' }} />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="col-span-12 lg:col-span-4 rounded-xl p-4 flex items-center justify-center" style={{ background: 'var(--db-card)', minHeight: 200 }}>
        <span className="text-[12px]" style={{ color: 'var(--db-t3)' }}>{t('db.transversal.reunionsEmpty')}</span>
      </div>
    )
  }

  const d = new Date(data.dateReunion)
  const day = d.getDate()
  const month = d.toLocaleDateString('fr-FR', { month: 'short' }).toUpperCase()

  return (
    <div className="col-span-12 lg:col-span-4 rounded-xl p-4" style={{ background: 'var(--db-card)', animation: 'db-rise 380ms ease-out 360ms both' }}>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em]" style={{ color: 'var(--db-t3)' }}>{t('db.transversal.reunions')}</span>
        <span className="ml-auto text-[11.5px] cursor-pointer hover:text-[var(--db-t1)] transition-colors" style={{ color: 'var(--db-t3)' }}>Archives →</span>
      </div>

      <div className="text-[34px] font-semibold db-tighter db-num leading-none" style={{ color: 'var(--db-t1)' }}>
        {day} {month}
      </div>
      <div className="text-[11px] uppercase tracking-[0.1em] mt-1.5" style={{ color: 'var(--db-t3)' }}>
        {data.heureDebut && data.heureFin ? `${data.heureDebut} — ${data.heureFin}` : formatDate(data.dateReunion, { weekday: 'long' })}
      </div>

      <div className="flex items-center gap-2 mt-3 text-[11.5px]" style={{ color: 'var(--db-t2)' }}>
        <span className="inline-flex items-center gap-[5px] px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ background: 'var(--db-success-bg)', color: 'var(--db-success)' }}>
          ✓ {data.statut === 'VALIDE' ? t('db.transversal.reunionStatutValide') : t('db.transversal.reunionStatutBrouillon')}
        </span>
        {data.lieu && <span style={{ color: 'var(--db-t3)' }}>{data.lieu}</span>}
      </div>

      <div className="flex gap-3.5 mt-3 pt-3 border-t text-[11.5px] db-num" style={{ borderColor: 'var(--db-border)', color: 'var(--db-t3)' }}>
        <span><strong className="font-semibold" style={{ color: 'var(--db-t1)' }}>{data.nombreParticipants}</strong> participants</span>
        <span><strong className="font-semibold" style={{ color: 'var(--db-t1)' }}>{data.nombrePointsProjet}</strong> points discutés</span>
      </div>

      {data.redacteurNom && (
        <div className="flex items-center gap-2 mt-3 text-[11.5px]" style={{ color: 'var(--db-t3)' }}>
          <div className="w-[22px] h-[22px] rounded-full grid place-items-center text-white text-[10px] font-semibold" style={{ background: 'linear-gradient(135deg, #FF6B35, #C8553D)' }}>
            {data.redacteurNom.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
          </div>
          <span>Rédigée par <strong className="font-medium" style={{ color: 'var(--db-t2)' }}>{data.redacteurNom}</strong></span>
        </div>
      )}
    </div>
  )
}
