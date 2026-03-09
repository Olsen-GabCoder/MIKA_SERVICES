import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
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

/** Clés des options prédéfinies d'ordre du jour (form.ordreDuJourOptions.xxx) */
const ORDRE_DU_JOUR_OPTION_KEYS = [
  'avancementEtudes',
  'avancementTravaux',
  'caHebdo',
  'previsions',
  'pointsBloquants',
  'besoinsMaterielHumain',
  'securite',
  'qualite',
  'planning',
  'comptesRendus',
  'suiviMarches',
  'alertes',
  'divers',
] as const

function parseOrdreDuJourText(text: string | null | undefined): string[] {
  if (!text || !text.trim()) return []
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*\d+\)\s*/, '').trim())
    .filter(Boolean)
}

function serializeOrdreDuJourItems(items: string[]): string {
  if (items.length === 0) return ''
  return items.map((item, i) => `${i + 1}) ${item}`).join('\n')
}

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
  const [ordreDuJourItems, setOrdreDuJourItems] = useState<string[]>([])
  const [ordreDuJourSelect, setOrdreDuJourSelect] = useState('')
  const [ordreDuJourCustomInput, setOrdreDuJourCustomInput] = useState('')
  const [statut, setStatut] = useState<StatutReunion>('BROUILLON')
  const [divers, setDivers] = useState('')
  const [redacteurId, setRedacteurId] = useState<number | ''>('')
  const [participantIds, setParticipantIds] = useState<number[]>([])

  useEffect(() => {
    userApi.getAll({ page: 0, size: 500 }).then((res) => setUsers(res.content)).catch(() => setUsers([]))
  }, [])

  useEffect(() => {
    if (!isEdit && ordreDuJourItems.length === 0) {
      setOrdreDuJourItems(parseOrdreDuJourText(t('form.ordreDuJourDefault')))
    }
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
          setOrdreDuJourItems(parseOrdreDuJourText(r.ordreDuJour) || parseOrdreDuJourText(t('form.ordreDuJourDefault')))
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
          ordreDuJour: serializeOrdreDuJourItems(ordreDuJourItems) || undefined,
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
          ordreDuJour: serializeOrdreDuJourItems(ordreDuJourItems) || undefined,
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

  const addOrdreDuJourFromList = () => {
    if (!ordreDuJourSelect) return
    const label = t(`form.ordreDuJourOptions.${ordreDuJourSelect}`)
    if (label && !ordreDuJourItems.includes(label)) {
      setOrdreDuJourItems((prev) => [...prev, label])
      setOrdreDuJourSelect('')
    }
  }

  const addOrdreDuJourCustom = () => {
    const value = ordreDuJourCustomInput.trim()
    if (value && !ordreDuJourItems.includes(value)) {
      setOrdreDuJourItems((prev) => [...prev, value])
      setOrdreDuJourCustomInput('')
    }
  }

  const removeOrdreDuJourItem = (index: number) => {
    setOrdreDuJourItems((prev) => prev.filter((_, i) => i !== index))
  }

  if (loading) return <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80"><div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('form.loading')}</div></PageContainer>

  return (
    <PageContainer size="full" className="space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <Card title={isEdit ? t('form.titleEdit') : t('form.titleNew')} className="max-w-4xl">
        {error && (
          <div className="mb-4">
            <Alert type="error" onClose={() => setError(null)}>{error}</Alert>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
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
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                value={ordreDuJourSelect}
                onChange={(e) => setOrdreDuJourSelect(e.target.value)}
                className="flex-1 min-w-[200px] px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">{t('form.ordreDuJourAddFromList')}</option>
                {ORDRE_DU_JOUR_OPTION_KEYS.map((key) => {
                  const label = t(`form.ordreDuJourOptions.${key}`)
                  if (ordreDuJourItems.includes(label)) return null
                  return (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  )
                })}
              </select>
              <Button type="button" variant="outline" size="sm" onClick={addOrdreDuJourFromList} disabled={!ordreDuJourSelect}>
                {t('form.ordreDuJourAddFromList')}
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <input
                type="text"
                value={ordreDuJourCustomInput}
                onChange={(e) => setOrdreDuJourCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addOrdreDuJourCustom())}
                placeholder={t('form.ordreDuJourCustomPlaceholder')}
                className="flex-1 min-w-[200px] px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-gray-100"
              />
              <Button type="button" variant="outline" size="sm" onClick={addOrdreDuJourCustom} disabled={!ordreDuJourCustomInput.trim()}>
                {t('form.ordreDuJourAddCustom')}
              </Button>
            </div>
            {ordreDuJourItems.length === 0 ? (
              <p className="text-small text-medium dark:text-gray-400 py-2">{t('form.ordreDuJourEmpty')}</p>
            ) : (
              <ul className="space-y-1.5 border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50/50 dark:bg-gray-800/30">
                {ordreDuJourItems.map((item, index) => (
                  <li key={`${index}-${item}`} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-dark dark:text-gray-200">
                      <span className="font-medium text-gray-500 dark:text-gray-400 mr-2">{index + 1}.</span>
                      {item}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeOrdreDuJourItem(index)}
                      className="text-danger hover:text-red-700 dark:text-red-400 text-xs font-medium shrink-0"
                    >
                      {t('form.ordreDuJourRemove')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
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
      </Card>
    </PageContainer>
  )
}
