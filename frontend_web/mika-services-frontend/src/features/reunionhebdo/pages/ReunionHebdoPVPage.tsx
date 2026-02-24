import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useConfirm } from '@/contexts/ConfirmContext'
import { PageContainer } from '@/components/layout/PageContainer'
import { reunionHebdoApi } from '@/api/reunionHebdoApi'
import { projetApi } from '@/api/projetApi'
import type { ReunionHebdo, PointProjetPV, PointProjetPVRequest } from '@/types/reunionHebdo'
import type { ProjetSummary } from '@/types/projet'

const formatTime = (timeStr?: string) => (timeStr ? timeStr.slice(0, 5).replace(':', 'h') : '-')

export const ReunionHebdoPVPage = () => {
  const { t, i18n } = useTranslation('reunionHebdo')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const locale = i18n.language === 'en' ? 'en-GB' : 'fr-FR'
  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const [pv, setPv] = useState<ReunionHebdo | null>(null)
  const [projets, setProjets] = useState<ProjetSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPoint, setEditingPoint] = useState<number | null>(null)
  const [addingPoint, setAddingPoint] = useState(false)
  const [newPointProjetId, setNewPointProjetId] = useState<number | ''>('')

  useEffect(() => {
    if (!id) return
    reunionHebdoApi.findById(Number(id)).then(setPv).catch(() => setPv(null)).finally(() => setLoading(false))
    projetApi.findAll(0, 200).then((res) => setProjets(res.content)).catch(() => setProjets([]))
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

  const handleAddPoint = async () => {
    if (!id || !newPointProjetId) return
    const existing = pv?.pointsProjet ?? []
    await reunionHebdoApi.savePointProjet(Number(id), {
      projetId: newPointProjetId,
      ordreAffichage: existing.length,
    })
    refreshPv()
    setNewPointProjetId('')
    setAddingPoint(false)
  }

  const handleDeletePoint = async (pointId: number) => {
    if (!id || !(await confirm({ messageKey: 'confirm.removeProjectFromPV' }))) return
    await reunionHebdoApi.deletePointProjet(Number(id), pointId)
    refreshPv()
    setEditingPoint(null)
  }

  if (loading || !pv) {
    return (
      <PageContainer>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{loading ? t('pv.loading') : t('pv.notFound')}</div>
      </PageContainer>
    )
  }

  const alreadyInPv = pv.pointsProjet.map((pp) => pp.projetId)
  const availableProjets = projets.filter((p) => !alreadyInPv.includes(p.id))

  return (
    <PageContainer size="wide">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('pv.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(pv.dateReunion)} — {pv.lieu || t('pv.lieuNonPrecise')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/reunions-hebdo/' + id + '/edit')} className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 px-4 py-2 rounded-lg font-medium">
            {t('pv.editMeeting')}
          </button>
          <button onClick={() => navigate('/reunions-hebdo')} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">{t('pv.backToList')}</button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden divide-y divide-gray-100 dark:divide-gray-600">
        <section className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pv.header')}</h2>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-900 dark:text-gray-200">
            <div><span className="text-gray-500 dark:text-gray-400">{t('pv.date')}</span> {formatDate(pv.dateReunion)}</div>
            <div><span className="text-gray-500 dark:text-gray-400">{t('pv.lieu')}</span> {pv.lieu || '-'}</div>
            <div><span className="text-gray-500 dark:text-gray-400">{t('pv.heure')}</span> {formatTime(pv.heureDebut)} - {formatTime(pv.heureFin)}</div>
            <div><span className="text-gray-500 dark:text-gray-400">{t('pv.redacteur')}</span> {pv.redacteur ? `${pv.redacteur.prenom} ${pv.redacteur.nom}` : '-'}</div>
          </div>
          {pv.ordreDuJour && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('pv.ordreDuJour')}</h3>
              <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">{pv.ordreDuJour}</pre>
            </div>
          )}
        </section>

        <section className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pv.participants')}</h2>
          <table className="w-full text-sm">
            <thead><tr><th className="text-left py-2 text-gray-600 dark:text-gray-400">{t('pv.colNom')}</th><th className="text-left py-2 text-gray-600 dark:text-gray-400">{t('pv.colInitiales')}</th><th className="text-left py-2 text-gray-600 dark:text-gray-400">{t('pv.colTelephone')}</th></tr></thead>
            <tbody>
              {pv.participants.map((p) => (
                <tr key={p.id}><td className="py-1">{p.prenom} {p.nom}</td><td className="py-1">{p.initiales || '-'}</td><td className="py-1">{p.telephone || '-'}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{t('pv.pointsParProjet')}</h2>
            {availableProjets.length > 0 && (
              !addingPoint ? (
                <button onClick={() => setAddingPoint(true)} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium">{t('pv.addProject')}</button>
              ) : (
                <div className="flex gap-2 items-center">
                  <select value={newPointProjetId} onChange={(e) => setNewPointProjetId(e.target.value ? Number(e.target.value) : '')} className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100">
                    <option value="">{t('pv.chooseProject')}</option>
                    {availableProjets.map((p) => <option key={p.id} value={p.id}>{p.nom}</option>)}
                  </select>
                  <button onClick={handleAddPoint} disabled={!newPointProjetId} className="bg-primary text-white px-3 py-1.5 rounded-lg text-sm disabled:opacity-50">{t('pv.add')}</button>
                  <button onClick={() => { setAddingPoint(false); setNewPointProjetId('') }} className="text-gray-600 dark:text-gray-400 text-sm">{t('pv.form.cancel')}</button>
                </div>
              )
            )}
          </div>

          {pv.pointsProjet.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm">{t('pv.noPointsProjet')}</p>
          ) : (
            <div className="space-y-6">
              {pv.pointsProjet.map((point, index) => (
                <div key={point.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-700/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">{t('pv.affaire', { n: index + 1, name: point.projetNom, code: point.projetCode })}</h3>
                    <button onClick={() => setEditingPoint(editingPoint === point.id ? null : point.id)} className="text-sm text-primary hover:underline">{t('pv.edit')}</button>
                  </div>
                  {point.chefProjetNom && <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{t('pv.chefProjet')} {point.chefProjetNom}</p>}
                  <div className="grid grid-cols-3 gap-4 text-sm mb-2 text-gray-900 dark:text-gray-200">
                    <div><span className="text-gray-500 dark:text-gray-400">{t('pv.avancementPhysique')}</span> {point.avancementPhysiquePct != null ? point.avancementPhysiquePct + ' %' : '-'}</div>
                    <div><span className="text-gray-500 dark:text-gray-400">{t('pv.avancementFinancier')}</span> {point.avancementFinancierPct != null ? point.avancementFinancierPct + ' %' : '-'}</div>
                    <div><span className="text-gray-500 dark:text-gray-400">{t('pv.delaiConsomme')}</span> {point.delaiConsommePct != null ? point.delaiConsommePct + ' %' : '-'}</div>
                  </div>
                  {point.resumeTravauxPrevisions && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.travauxPrevisions')}</span> {point.resumeTravauxPrevisions}</p>}
                  {point.pointsBloquantsResume && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.pointsBloquants')}</span> {point.pointsBloquantsResume}</p>}
                  {point.besoinsMateriel && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.besoinsMateriel')}</span> {point.besoinsMateriel}</p>}
                  {point.besoinsHumain && <p className="text-sm text-gray-700 dark:text-gray-300 mb-1"><span className="font-medium">{t('pv.besoinsHumain')}</span> {point.besoinsHumain}</p>}
                  {point.propositionsAmelioration && <p className="text-sm text-gray-700 dark:text-gray-300"><span className="font-medium">{t('pv.propositions')}</span> {point.propositionsAmelioration}</p>}
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
        </section>

        {pv.divers && (
          <section className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">{t('pv.divers')}</h2>
            <pre className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">{pv.divers}</pre>
          </section>
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
    <form onSubmit={handleSubmit} className="mt-4 p-4 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg space-y-3">
      <div className="grid grid-cols-3 gap-4">
        <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.avPhysiquePct')}</label><input type="number" min={0} max={100} step={0.01} value={avancementPhysiquePct} onChange={(e) => setAvancementPhysiquePct(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
        <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.avFinancierPct')}</label><input type="number" min={0} max={100} step={0.01} value={avancementFinancierPct} onChange={(e) => setAvancementFinancierPct(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
        <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.delaiConsommePct')}</label><input type="number" min={0} max={100} step={0.01} value={delaiConsommePct} onChange={(e) => setDelaiConsommePct(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      </div>
      <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.travauxPrevisions')}</label><textarea value={resumeTravauxPrevisions} onChange={(e) => setResumeTravauxPrevisions(e.target.value)} rows={2} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.pointsBloquants')}</label><textarea value={pointsBloquantsResume} onChange={(e) => setPointsBloquantsResume(e.target.value)} rows={2} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.besoinsMateriel')}</label><textarea value={besoinsMateriel} onChange={(e) => setBesoinsMateriel(e.target.value)} rows={1} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.besoinsHumain')}</label><textarea value={besoinsHumain} onChange={(e) => setBesoinsHumain(e.target.value)} rows={1} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      <div><label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">{t('pv.form.propositions')}</label><textarea value={propositionsAmelioration} onChange={(e) => setPropositionsAmelioration(e.target.value)} rows={1} className="w-full border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
      <div className="flex gap-2 pt-2">
        <button type="submit" disabled={saving} className="bg-primary text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">{t('pv.form.save')}</button>
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 px-3 py-1.5 rounded text-sm">{t('pv.form.cancel')}</button>
        <button type="button" onClick={() => onDelete()} className="text-red-600 text-sm">{t('pv.form.removeFromPV')}</button>
      </div>
    </form>
  )
}
