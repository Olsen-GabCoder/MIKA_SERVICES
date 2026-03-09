import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Alert } from '@/components/ui/Alert'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { projetApi, pointBloquantApi } from '@/api/projetApi'
import type { ReunionHebdo, PointProjetPV, PointProjetPVRequest } from '@/types/reunionHebdo'
import { useFormatDate } from '@/hooks/useFormatDate'
import { getWeekYearFromDateString } from '@/utils/weekFromDate'
import { generatePVDocument } from '@/features/reunionhebdo/export'

const formatTime = (timeStr?: string) => (timeStr ? timeStr.slice(0, 5).replace(':', 'h') : '-')

export const ReunionHebdoPVPage = () => {
  const { t } = useTranslation('reunionHebdo')
  const formatDate = useFormatDate()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [pv, setPv] = useState<ReunionHebdo | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingPoint, setEditingPoint] = useState<number | null>(null)
  const [exportingPV, setExportingPV] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    reunionHebdoApi.findById(Number(id)).then(setPv).catch(() => setPv(null)).finally(() => setLoading(false))
  }, [id])

  const refreshPv = () => {
    if (id) reunionHebdoApi.findById(Number(id)).then(setPv)
  }

  const handleSavePoint = async (data: PointProjetPVRequest) => {
    if (!id) return
    await reunionHebdoApi.savePointProjet(Number(id), data)
    refreshPv()
    setEditingPoint(null)
  }

  const handleDeletePoint = async (pointId: number) => {
    if (!id || !(await confirm({ messageKey: 'confirm.removeProjectFromPV' }))) return
    await reunionHebdoApi.deletePointProjet(Number(id), pointId)
    refreshPv()
    setEditingPoint(null)
  }

  const handleDownloadPV = async () => {
    if (!pv) return
    setDownloadError(null)
    setExportingPV(true)
    try {
      const { week, year } = getWeekYearFromDateString(pv.dateReunion)
      const listRes = await projetApi.findAll(0, 500)
      const results = await Promise.allSettled(
        listRes.content.map((p) =>
          Promise.all([
            projetApi.findById(p.id),
            projetApi.getPrevisions(p.id),
            pointBloquantApi.findByProjet(p.id, 0, 100),
          ]).then(([projet, previsions, pointsBloquantsRes]) => ({
            projet,
            previsions: previsions ?? [],
            pointsBloquants: pointsBloquantsRes?.content ?? [],
          }))
        )
      )
      const projetsData = results
        .filter((r): r is PromiseFulfilledResult<{ projet: Awaited<ReturnType<typeof projetApi.findById>>; previsions: Awaited<ReturnType<typeof projetApi.getPrevisions>>; pointsBloquants: Awaited<ReturnType<typeof pointBloquantApi.findByProjet>>['content'] }> => r.status === 'fulfilled')
        .map((r) => r.value)
      projetsData.sort((a, b) => a.projet.nom.localeCompare(b.projet.nom, 'fr'))
      await generatePVDocument({
        reunion: pv,
        semaineReunion: week,
        anneeReunion: year,
        projetsData,
        formatDate: (d) => formatDate(d),
        formatTime: () => new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : t('form.errorGeneric')
      setDownloadError(message)
      console.error('Erreur téléchargement PV:', err)
    } finally {
      setExportingPV(false)
    }
  }

  if (loading || !pv) {
    return (
      <PageContainer size="full" className="bg-gray-50/80 dark:bg-gray-900/80">
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{loading ? t('pv.loading') : t('pv.notFound')}</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer size="full" className="space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      {downloadError && (
        <Alert type="error" onClose={() => setDownloadError(null)}>{downloadError}</Alert>
      )}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('pv.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(pv.dateReunion, { weekday: 'long', monthStyle: 'long' })} — {pv.lieu || t('pv.lieuNonPrecise')}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="primary" size="sm" onClick={handleDownloadPV} disabled={exportingPV} isLoading={exportingPV}>
            {t('pv.downloadPV')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reunions-hebdo/' + id + '/edit')}>
            {t('pv.editMeeting')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/reunions-hebdo')}>
            {t('pv.backToList')}
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <Card title={t('pv.header')}>
          <div className="grid grid-cols-2 gap-4 text-sm text-dark dark:text-gray-200">
            <div><span className="text-medium dark:text-gray-400">{t('pv.date')}</span> {formatDate(pv.dateReunion, { weekday: 'long', monthStyle: 'long' })}</div>
            <div><span className="text-medium dark:text-gray-400">{t('pv.lieu')}</span> {pv.lieu || '-'}</div>
            <div><span className="text-medium dark:text-gray-400">{t('pv.heure')}</span> {formatTime(pv.heureDebut)} - {formatTime(pv.heureFin)}</div>
            <div><span className="text-medium dark:text-gray-400">{t('pv.redacteur')}</span> {pv.redacteur ? `${pv.redacteur.prenom} ${pv.redacteur.nom}` : '-'}</div>
          </div>
          {pv.ordreDuJour && (
            <div className="mt-4">
              <h3 className="text-small font-medium text-dark dark:text-gray-300 mb-xs">{t('pv.ordreDuJour')}</h3>
              <pre className="text-small text-medium dark:text-gray-400 whitespace-pre-wrap font-sans">{pv.ordreDuJour}</pre>
            </div>
          )}
        </Card>

        <Card title={t('pv.participants')}>
          <table className="w-full text-small">
            <thead><tr><th className="text-left py-2 text-medium dark:text-gray-400">{t('pv.colNom')}</th><th className="text-left py-2 text-medium dark:text-gray-400">{t('pv.colInitiales')}</th><th className="text-left py-2 text-medium dark:text-gray-400">{t('pv.colTelephone')}</th></tr></thead>
            <tbody>
              {pv.participants.map((p) => (
                <tr key={p.id}><td className="py-1">{p.prenom} {p.nom}</td><td className="py-1">{p.initiales || '-'}</td><td className="py-1">{p.telephone || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title={t('pv.pointsParProjet')}>
          {pv.pointsProjet.length === 0 ? (
            <p className="text-medium dark:text-gray-400 text-small">{t('pv.noPointsProjet')}</p>
          ) : (
            <div className="space-y-6">
              {pv.pointsProjet.map((point, index) => (
                <div key={point.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-700/50 surface-elevated">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-dark dark:text-gray-100">{t('pv.affaire', { n: index + 1, name: point.projetNom, code: point.projetCode })}</h3>
                    <Button variant="outline" size="sm" onClick={() => setEditingPoint(editingPoint === point.id ? null : point.id)}>{t('pv.edit')}</Button>
                  </div>
                  {point.chefProjetNom && <p className="text-small text-medium dark:text-gray-400 mb-2">{t('pv.chefProjet')} {point.chefProjetNom}</p>}
                  <div className="grid grid-cols-3 gap-4 text-small mb-2 text-dark dark:text-gray-200">
                    <div><span className="text-medium dark:text-gray-400">{t('pv.avancementPhysique')}</span> {point.avancementPhysiquePct != null ? point.avancementPhysiquePct + ' %' : '-'}</div>
                    <div><span className="text-medium dark:text-gray-400">{t('pv.avancementFinancier')}</span> {point.avancementFinancierPct != null ? point.avancementFinancierPct + ' %' : '-'}</div>
                    <div><span className="text-medium dark:text-gray-400">{t('pv.delaiConsomme')}</span> {point.delaiConsommePct != null ? point.delaiConsommePct + ' %' : '-'}</div>
                  </div>
                  {point.resumeTravauxPrevisions && <p className="text-small text-dark dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.travauxPrevisions')}</span> {point.resumeTravauxPrevisions}</p>}
                  {point.pointsBloquantsResume && <p className="text-small text-dark dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.pointsBloquants')}</span> {point.pointsBloquantsResume}</p>}
                  {point.besoinsMateriel && <p className="text-small text-dark dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.besoinsMateriel')}</span> {point.besoinsMateriel}</p>}
                  {point.besoinsHumain && <p className="text-small text-dark dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.besoinsHumain')}</span> {point.besoinsHumain}</p>}
                  {point.propositionsAmelioration && <p className="text-small text-dark dark:text-gray-300"><span className="font-medium">{t('pv.propositions')}</span> {point.propositionsAmelioration}</p>}
                  {editingPoint === point.id && (
                    <PointProjetEditForm
                      point={point}
                      onSave={handleSavePoint}
                      onCancel={() => setEditingPoint(null)}
                      onDelete={() => handleDeletePoint(point.id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {pv.divers && (
          <Card title={t('pv.divers')}>
            <pre className="text-small text-medium dark:text-gray-400 whitespace-pre-wrap font-sans">{pv.divers}</pre>
          </Card>
        )}
      </div>
    </PageContainer>
  )
}

function PointProjetEditForm({
  point,
  onSave,
  onCancel,
  onDelete,
}: {
  point: PointProjetPV
  onSave: (data: PointProjetPVRequest) => Promise<void>
  onCancel: () => void
  onDelete: () => void
}) {
  const { t } = useTranslation('reunionHebdo')
  const [saving, setSaving] = useState(false)
  const [avancementPhysiquePct, setAvancementPhysiquePct] = useState<string>(String(point.avancementPhysiquePct ?? ''))
  const [avancementFinancierPct, setAvancementFinancierPct] = useState<string>(String(point.avancementFinancierPct ?? ''))
  const [delaiConsommePct, setDelaiConsommePct] = useState<string>(String(point.delaiConsommePct ?? ''))
  const [resumeTravauxPrevisions, setResumeTravauxPrevisions] = useState(point.resumeTravauxPrevisions ?? '')
  const [pointsBloquantsResume, setPointsBloquantsResume] = useState(point.pointsBloquantsResume ?? '')
  const [besoinsMateriel, setBesoinsMateriel] = useState(point.besoinsMateriel ?? '')
  const [besoinsHumain, setBesoinsHumain] = useState(point.besoinsHumain ?? '')
  const [propositionsAmelioration, setPropositionsAmelioration] = useState(point.propositionsAmelioration ?? '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await onSave({
      projetId: point.projetId,
      avancementPhysiquePct: avancementPhysiquePct ? Number(avancementPhysiquePct) : undefined,
      avancementFinancierPct: avancementFinancierPct ? Number(avancementFinancierPct) : undefined,
      delaiConsommePct: delaiConsommePct ? Number(delaiConsommePct) : undefined,
      resumeTravauxPrevisions: resumeTravauxPrevisions || undefined,
      pointsBloquantsResume: pointsBloquantsResume || undefined,
      besoinsMateriel: besoinsMateriel || undefined,
      besoinsHumain: besoinsHumain || undefined,
      propositionsAmelioration: propositionsAmelioration || undefined,
      ordreAffichage: point.ordreAffichage,
    })
    setSaving(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 surface-elevated border border-gray-200 dark:border-gray-600 rounded-lg space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <Input label={t('pv.form.avPhysiquePct')} type="number" min={0} max={100} step={0.01} value={avancementPhysiquePct} onChange={(e) => setAvancementPhysiquePct(e.target.value)} />
        <Input label={t('pv.form.avFinancierPct')} type="number" min={0} max={100} step={0.01} value={avancementFinancierPct} onChange={(e) => setAvancementFinancierPct(e.target.value)} />
        <Input label={t('pv.form.delaiConsommePct')} type="number" min={0} max={100} step={0.01} value={delaiConsommePct} onChange={(e) => setDelaiConsommePct(e.target.value)} />
      </div>
      <div>
        <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('pv.form.travauxPrevisions')}</label>
        <textarea value={resumeTravauxPrevisions} onChange={(e) => setResumeTravauxPrevisions(e.target.value)} rows={2} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100" />
      </div>
      <div>
        <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('pv.form.pointsBloquants')}</label>
        <textarea value={pointsBloquantsResume} onChange={(e) => setPointsBloquantsResume(e.target.value)} rows={2} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100" />
      </div>
      <div>
        <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('pv.form.besoinsMateriel')}</label>
        <textarea value={besoinsMateriel} onChange={(e) => setBesoinsMateriel(e.target.value)} rows={1} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100" />
      </div>
      <div>
        <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('pv.form.besoinsHumain')}</label>
        <textarea value={besoinsHumain} onChange={(e) => setBesoinsHumain(e.target.value)} rows={1} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100" />
      </div>
      <div>
        <label className="block text-small font-medium text-dark dark:text-gray-200 mb-xs">{t('pv.form.propositions')}</label>
        <textarea value={propositionsAmelioration} onChange={(e) => setPropositionsAmelioration(e.target.value)} rows={1} className="w-full px-md py-sm border border-medium dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-gray-100" />
      </div>
      <div className="flex flex-wrap gap-2 pt-2">
        <Button type="submit" variant="primary" size="sm" disabled={saving} isLoading={saving}>{t('pv.form.save')}</Button>
        <Button type="button" variant="outline" size="sm" onClick={onCancel}>{t('pv.form.cancel')}</Button>
        <Button type="button" variant="danger" size="sm" onClick={() => onDelete()}>{t('pv.form.removeFromPV')}</Button>
      </div>
    </form>
  )
}
