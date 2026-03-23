import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageContainer } from '@/components/layout/PageContainer'
import { Button } from '@/components/ui/Button'
import { useCorpsEtat, useCreateBaremeArticle } from '../hooks/useBaremeQueries'
import { TypeLigneBareme, type BaremePrestationLigneCreateRequest } from '../types'
import { handleApiError } from '@/utils/errorHandler'

const emptyLigne = (): BaremePrestationLigneCreateRequest => ({
  libelle: '',
  quantite: null,
  prixUnitaire: null,
  unite: '',
  somme: null,
  prixEstime: false,
})

const toNullableNumber = (value: string): number | null => {
  const v = value.trim()
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function BaremeArticleCreatePage() {
  const { t } = useTranslation('bareme')
  const navigate = useNavigate()
  const { data: corpsEtats = [] } = useCorpsEtat()
  const createMutation = useCreateBaremeArticle()

  const [type, setType] = useState<TypeLigneBareme>(TypeLigneBareme.MATERIAU)
  const [corpsEtatId, setCorpsEtatId] = useState<number | ''>('')
  const [reference, setReference] = useState('')
  const [libelle, setLibelle] = useState('')
  const [unite, setUnite] = useState('')
  const [famille, setFamille] = useState('')
  const [categorie, setCategorie] = useState('')
  const [fournisseurNom, setFournisseurNom] = useState('')
  const [fournisseurContact, setFournisseurContact] = useState('')
  const [prixTtc, setPrixTtc] = useState('')
  const [datePrix, setDatePrix] = useState('')
  const [debourse, setDebourse] = useState('')
  const [prixVente, setPrixVente] = useState('')
  const [coefficientPv, setCoefficientPv] = useState('')
  const [unitePrestation, setUnitePrestation] = useState('')
  const [prixEstime, setPrixEstime] = useState(false)
  const [totauxEstimes, setTotauxEstimes] = useState(false)
  const [lignes, setLignes] = useState<BaremePrestationLigneCreateRequest[]>([emptyLigne()])
  const [error, setError] = useState<string | null>(null)

  const isMateriau = type === TypeLigneBareme.MATERIAU
  const inputClass = 'w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary focus:border-transparent'
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1 uppercase tracking-wide'

  const isValid = useMemo(() => {
    if (!corpsEtatId || !libelle.trim()) return false
    if (isMateriau) return fournisseurNom.trim().length > 0
    return debourse.trim().length > 0 && prixVente.trim().length > 0
  }, [corpsEtatId, libelle, isMateriau, fournisseurNom, debourse, prixVente])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isValid || !corpsEtatId) return
    try {
      const payload = {
        corpsEtatId,
        type,
        reference: reference.trim() || null,
        libelle: libelle.trim(),
        unite: unite.trim() || null,
        famille: famille.trim() || null,
        categorie: categorie.trim() || null,
        fournisseurNom: isMateriau ? (fournisseurNom.trim() || null) : null,
        fournisseurContact: isMateriau ? (fournisseurContact.trim() || null) : null,
        prixTtc: isMateriau ? toNullableNumber(prixTtc) : null,
        datePrix: isMateriau ? (datePrix.trim() || null) : null,
        prixEstime,
        debourse: isMateriau ? null : toNullableNumber(debourse),
        prixVente: isMateriau ? null : toNullableNumber(prixVente),
        coefficientPv: isMateriau ? null : toNullableNumber(coefficientPv),
        unitePrestation: isMateriau ? null : (unitePrestation.trim() || null),
        totauxEstimes,
        lignesPrestation: isMateriau
          ? []
          : lignes
              .filter((l) => l.libelle.trim().length > 0)
              .map((l) => ({
                ...l,
                libelle: l.libelle.trim(),
                unite: l.unite?.trim() || null,
                quantite: l.quantite ?? null,
                prixUnitaire: l.prixUnitaire ?? null,
                somme: l.somme ?? null,
              })),
      }
      const created = await createMutation.mutateAsync(payload)
      navigate(`/bareme/articles/${created.id}`)
    } catch (err) {
      setError(handleApiError(err))
    }
  }

  return (
    <PageContainer size="full" className="min-h-full bg-gray-50/80 dark:bg-gray-900/80 space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-primary to-primary-dark text-white shadow-lg overflow-hidden">
        <div className="px-6 py-6 md:py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t('create.title')}</h1>
            <p className="text-white/90 text-sm mt-1">{t('create.subtitle')}</p>
          </div>
          <Button type="button" variant="outline" className="!border-white/40 !text-white hover:!bg-white/15" onClick={() => navigate('/bareme')}>
            ← {t('detail.backToList')}
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6 shadow-sm">
        {error && (
          <div className="mb-5 rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('create.baseInfo')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>{t('create.type')}</label>
              <select value={type} onChange={(e) => setType(e.target.value as TypeLigneBareme)} className={inputClass}>
                <option value={TypeLigneBareme.MATERIAU}>{t('list.typeMateriau')}</option>
                <option value={TypeLigneBareme.PRESTATION_ENTETE}>{t('list.typePrestation')}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('create.corpsEtat')}</label>
              <select value={corpsEtatId} onChange={(e) => setCorpsEtatId(e.target.value ? Number(e.target.value) : '')} className={inputClass}>
                <option value="">{t('list.all')}</option>
                {corpsEtats.map((c) => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t('detail.reference')}</label>
              <input value={reference} onChange={(e) => setReference(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('list.colArticle')}</label>
              <input value={libelle} onChange={(e) => setLibelle(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('detail.unite')}</label>
              <input value={unite} onChange={(e) => setUnite(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t('detail.famille')}</label>
              <input value={famille} onChange={(e) => setFamille(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t('detail.categorie')}</label>
              <input value={categorie} onChange={(e) => setCategorie(e.target.value)} className={inputClass} />
            </div>
          </div>
          </div>

          {isMateriau ? (
            <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('create.materialSection')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input placeholder={t('detail.colFournisseur')} value={fournisseurNom} onChange={(e) => setFournisseurNom(e.target.value)} className={inputClass} />
                <input placeholder={t('detail.colContact')} value={fournisseurContact} onChange={(e) => setFournisseurContact(e.target.value)} className={inputClass} />
                <input placeholder={t('detail.colPrixTtc')} value={prixTtc} onChange={(e) => setPrixTtc(e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input placeholder={t('detail.colDatePrix')} value={datePrix} onChange={(e) => setDatePrix(e.target.value)} className={inputClass} />
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input type="checkbox" checked={prixEstime} onChange={(e) => setPrixEstime(e.target.checked)} />
                  {t('create.priceEstimated')}
                </label>
              </div>
            </div>
          ) : (
            <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-600 p-4">
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">{t('create.prestationSection')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input placeholder={t('detail.debourse')} value={debourse} onChange={(e) => setDebourse(e.target.value)} className={inputClass} />
                <input placeholder={t('detail.prixVente')} value={prixVente} onChange={(e) => setPrixVente(e.target.value)} className={inputClass} />
                <input placeholder={t('detail.coefficientPv')} value={coefficientPv} onChange={(e) => setCoefficientPv(e.target.value)} className={inputClass} />
                <input placeholder={t('detail.colUnite')} value={unitePrestation} onChange={(e) => setUnitePrestation(e.target.value)} className={inputClass} />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={totauxEstimes} onChange={(e) => setTotauxEstimes(e.target.checked)} />
                {t('create.totalEstimated')}
              </label>
              <div className="space-y-3">
                <p className="font-medium text-gray-800 dark:text-gray-200">{t('create.breakdownLines')}</p>
                {lignes.map((ligne, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-start">
                    <input
                      placeholder={t('detail.colLibelle')}
                      value={ligne.libelle}
                      onChange={(e) => setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, libelle: e.target.value } : l))}
                      className={`${inputClass} md:col-span-2`}
                    />
                    <input placeholder={t('detail.colQuantite')} value={ligne.quantite ?? ''} onChange={(e) => setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, quantite: toNullableNumber(e.target.value) } : l))} className={inputClass} />
                    <input placeholder={t('detail.colPrixUnitaire')} value={ligne.prixUnitaire ?? ''} onChange={(e) => setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, prixUnitaire: toNullableNumber(e.target.value) } : l))} className={inputClass} />
                    <input placeholder={t('detail.colUnite')} value={ligne.unite ?? ''} onChange={(e) => setLignes((prev) => prev.map((l, i) => i === idx ? { ...l, unite: e.target.value } : l))} className={inputClass} />
                    <button type="button" onClick={() => setLignes((prev) => prev.filter((_, i) => i !== idx))} className="px-3 py-2 border rounded-lg text-red-600 border-red-200 hover:bg-red-50 dark:border-red-700 dark:hover:bg-red-900/20">
                      {t('create.removeLine')}
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setLignes((prev) => [...prev, emptyLigne()])} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-sm">
                  {t('create.addLine')}
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
            <Button type="submit" disabled={!isValid || createMutation.isPending} isLoading={createMutation.isPending}>
              {createMutation.isPending ? t('create.creating') : t('create.create')}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/bareme')}>
              {t('create.cancel')}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
