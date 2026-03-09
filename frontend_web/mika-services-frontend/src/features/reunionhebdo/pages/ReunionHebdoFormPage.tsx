import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { userApi } from '@/api/userApi'
import type {
  ReunionHebdoCreateRequest,
  ReunionHebdoUpdateRequest,
  ParticipantReunionRequest,
  StatutReunion,
} from '@/types/reunionHebdo'
import type { User } from '@/types'

const STATUT_REUNION_VALUES: StatutReunion[] = ['BROUILLON', 'VALIDE']

export const ReunionHebdoFormPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateReunion, setDateReunion] = useState('')
  const [lieu, setLieu] = useState('')
  const [heureDebut, setHeureDebut] = useState('')
  const [heureFin, setHeureFin] = useState('')
  const [ordreDuJour, setOrdreDuJour] = useState('')
  const [statut, setStatut] = useState<StatutReunion>('BROUILLON')
  const [divers, setDivers] = useState('')
  const [redacteurId, setRedacteurId] = useState<number | ''>('')
  const [participantIds, setParticipantIds] = useState<number[]>([])

  useEffect(() => {
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content)).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (!isEdit && !ordreDuJour) setOrdreDuJour(t('form.ordreDuJourDefault'))
  }, [isEdit, t])

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      reunionHebdoApi.findById(Number(id))
        .then((r) => {
          setDateReunion(r.dateReunion.slice(0, 10))
          setLieu(r.lieu || '')
          setHeureDebut(r.heureDebut ? r.heureDebut.slice(0, 5) : '')
          setHeureFin(r.heureFin ? r.heureFin.slice(0, 5) : '')
          setOrdreDuJour(r.ordreDuJour || t('form.ordreDuJourDefault'))
          setStatut(r.statut)
          setDivers(r.divers || '')
          setRedacteurId(r.redacteur?.id ?? '')
          setParticipantIds(r.participants.map((p) => p.userId))
        })
        .catch(() => setError(t('form.notFound')))
        .finally(() => setLoading(false))
    }
  }, [isEdit, id, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    const participants: ParticipantReunionRequest[] = participantIds.map((userId) => ({ userId, present: true }))
    try {
      if (isEdit && id) {
        const data: ReunionHebdoUpdateRequest = {
          dateReunion: dateReunion || undefined,
          lieu: lieu || undefined,
          heureDebut: heureDebut ? heureDebut + ':00' : undefined,
          heureFin: heureFin ? heureFin + ':00' : undefined,
          ordreDuJour: ordreDuJour || undefined,
          statut,
          divers: divers || undefined,
          redacteurId: redacteurId || undefined,
          participants,
        }
        await reunionHebdoApi.update(Number(id), data)
      } else {
        const data: ReunionHebdoCreateRequest = {
          dateReunion,
          lieu: lieu || undefined,
          heureDebut: heureDebut ? heureDebut + ':00' : undefined,
          heureFin: heureFin ? heureFin + ':00' : undefined,
          ordreDuJour: ordreDuJour || undefined,
          statut,
          divers: divers || undefined,
          redacteurId: redacteurId || undefined,
          participants,
        }
        await reunionHebdoApi.create(data)
      }
      navigate('/reunions-hebdo')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('form.errorGeneric'))
    } finally {
      setSaving(false)
    }
  }

  const toggleParticipant = (userId: number) => {
    setParticipantIds((prev) => (prev.includes(userId) ? prev.filter((i) => i !== userId) : [...prev, userId]))
  }

  if (loading) return <PageContainer><div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('form.loading')}</div></PageContainer>

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{isEdit ? t('form.titleEdit') : t('form.titleNew')}</h1>
      </div>
      {error && (
        <div className="mb-4">
          <Alert type="error" onClose={() => setError(null)}>{error}</Alert>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('form.date')} type="date" required value={dateReunion} onChange={(e) => setDateReunion(e.target.value)} />
          <Input label={t('form.lieu')} type="text" value={lieu} onChange={(e) => setLieu(e.target.value)} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('form.heureDebut')} type="time" value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} />
          <Input label={t('form.heureFin')} type="time" value={heureFin} onChange={(e) => setHeureFin(e.target.value)} />
        </div>
        <div>
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('form.redacteur')}</label>
          <select value={redacteurId} onChange={(e) => setRedacteurId(e.target.value ? Number(e.target.value) : '')} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100">
            <option value="">{t('form.choose')}</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.prenom} {u.nom}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('form.ordreDuJour')}</label>
          <textarea value={ordreDuJour} onChange={(e) => setOrdreDuJour(e.target.value)} rows={5} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('form.statut')}</label>
          <select value={statut} onChange={(e) => setStatut(e.target.value as StatutReunion)} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100">
            {STATUT_REUNION_VALUES.map((v) => <option key={v} value={v}>{t(`statut.${v}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('form.divers')}</label>
          <textarea value={divers} onChange={(e) => setDivers(e.target.value)} rows={3} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100" />
        </div>
        <div>
          <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('form.participants')}</label>
          <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 dark:bg-gray-800/50">
            {users.map((u) => (
              <label key={u.id} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={participantIds.includes(u.id)} onChange={() => toggleParticipant(u.id)} className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-500" />
                <span className="text-sm text-dark dark:text-gray-200">{u.prenom} {u.nom}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-3 pt-4">
          <Button type="submit" variant="primary" disabled={saving} isLoading={saving}>
            {isEdit ? t('form.save') : t('form.create')}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/reunions-hebdo')}>
            {t('form.cancel')}
          </Button>
          {isEdit && id && (
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/reunions-hebdo/' + id)}>
              {t('form.viewPV')}
            </Button>
          )}
        </div>
      </form>
    </PageContainer>
  )
}
