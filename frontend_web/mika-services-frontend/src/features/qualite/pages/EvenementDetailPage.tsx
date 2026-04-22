import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { fetchEvenementById, setCurrent } from '@/store/slices/qualiteEvenementSlice'
import { qualiteEvenementApi } from '@/api/qualiteEvenementApi'
import { PageContainer } from '@/components/layout/PageContainer'
import { NumeroSection, RoleCollegial } from '@/types/qualiteEvenement'
import type { SectionResponse, EvenementQualiteResponse } from '@/types/qualiteEvenement'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'
const BODY = 'p-4 sm:p-5'

const sectionTitles: Record<string, string> = {
  SECTION_1: 'evenements.sections.s1',
  SECTION_2: 'evenements.sections.s2',
  SECTION_4: 'evenements.sections.s4',
  SECTION_5: 'evenements.sections.s5',
  SECTION_6: 'evenements.sections.s6',
  SECTION_7: 'evenements.sections.s7',
}

const statutColors: Record<string, string> = {
  BROUILLON: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  DETECTEE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  EN_TRAITEMENT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  EN_VERIFICATION: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  LEVEE: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  ANALYSEE: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  CLOTUREE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
}

export default function EvenementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation('qualite')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { current: evenement, loading } = useAppSelector(s => s.qualiteEvenement)
  const currentUser = useAppSelector(s => s.auth.user)

  const [signingSection, setSigningSection] = useState<string | null>(null)

  useEffect(() => {
    if (id) dispatch(fetchEvenementById(Number(id)))
  }, [dispatch, id])

  const handleSignSection = async (numSection: number) => {
    if (!evenement || !currentUser) return
    setSigningSection(String(numSection))
    try {
      const updated = await qualiteEvenementApi.signerSection(evenement.id, numSection, currentUser.id)
      dispatch(setCurrent(updated))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de signature'
      alert(msg)
    } finally {
      setSigningSection(null)
    }
  }

  const handleSignCollegiale = async (role: RoleCollegial) => {
    if (!evenement || !currentUser) return
    setSigningSection(`6-${role}`)
    try {
      const updated = await qualiteEvenementApi.signerCollegiale(evenement.id, currentUser.id, role)
      dispatch(setCurrent(updated))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur de signature'
      alert(msg)
    } finally {
      setSigningSection(null)
    }
  }

  if (loading || !evenement) {
    return (
      <PageContainer size="full" className="space-y-4 sm:space-y-6">
        <div className="p-8 text-center text-gray-400">
          <div className="w-8 h-8 border-3 border-gray-300 dark:border-gray-600 border-t-[#FF6B35] rounded-full animate-spin mx-auto" />
        </div>
      </PageContainer>
    )
  }

  const workflowOrder = [NumeroSection.SECTION_1, NumeroSection.SECTION_2, NumeroSection.SECTION_4, NumeroSection.SECTION_5, NumeroSection.SECTION_6, NumeroSection.SECTION_7]
  const signedSections = new Set(evenement.sections.filter(s => s.signee).map(s => s.numeroSection))
  const nextSection = workflowOrder.find(ns => !signedSections.has(ns))

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6">
      {/* Back button */}
      <button onClick={() => navigate('/qualite/evenements')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#FF6B35] dark:text-gray-400 dark:hover:text-[#FF6B35] transition-colors font-medium">
        &larr; {t('evenements.backToList')}
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-3">
          <span className="font-mono text-lg text-gray-500 dark:text-gray-400">{evenement.reference}</span>
          <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${statutColors[evenement.statut] ?? ''}`}>
            {t(`evenements.statuts.${evenement.statut}`)}
          </span>
        </h1>
      </div>

      {/* Info card */}
      <div className={CARD}>
        <div className={BODY}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('evenements.type')}</span>
              <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{evenement.typeEvenement}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('evenements.origine')}</span>
              <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{t(`evenements.origines.${evenement.origine}`)}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('evenements.ouvrage')}</span>
              <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{evenement.ouvrageConcerne ?? '\u2014'}</div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">{t('evenements.cctp')}</span>
              <div className="font-semibold text-gray-900 dark:text-white mt-0.5">{evenement.controleExigeCctp ? t('evenements.oui') : t('evenements.non')}</div>
            </div>
          </div>
          {evenement.description && (
            <div className="text-sm text-gray-700 dark:text-gray-300 border-t border-gray-200 dark:border-gray-600 pt-3 mt-4">{evenement.description}</div>
          )}
        </div>
      </div>

      {/* Timeline + sections */}
      <div className="space-y-4">
        {evenement.sections.map((section: SectionResponse) => {
          const isActive = section.numeroSection === nextSection
          const sectionNum = section.numeroSection.replace('SECTION_', '')

          const borderColor = section.signee
            ? 'border-l-green-500'
            : isActive
              ? 'border-l-[#FF6B35]'
              : 'border-l-gray-300 dark:border-l-gray-600'

          return (
            <div key={section.id}
              className={`${CARD} border-l-4 ${borderColor}`}>
              <div className={BODY}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    Section {sectionNum} — {t(sectionTitles[section.numeroSection])}
                  </h3>
                  {section.signee ? (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                      {t('evenements.signedBy')} {section.signataireEffectifNom} — {section.dateSignature?.substring(0, 10)}
                    </span>
                  ) : section.signataireDesigneNom ? (
                    <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {t('evenements.assignedTo')} {section.signataireDesigneNom}
                    </span>
                  ) : null}
                </div>

                {section.contenu && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{section.contenu}</p>
                )}

                {/* Section 2: actions */}
                {section.actionsTraitement.length > 0 && (
                  <div className="mb-3 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-gray-500 dark:text-gray-400">
                          <th className="text-left py-1.5">{t('evenements.action')}</th>
                          <th className="text-left py-1.5">{t('evenements.responsable')}</th>
                          <th className="text-left py-1.5">{t('evenements.delai')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.actionsTraitement.map(a => (
                          <tr key={a.id} className="border-t border-gray-100 dark:border-gray-700">
                            <td className="py-1.5 text-gray-700 dark:text-gray-300">{a.descriptionAction}</td>
                            <td className="py-1.5 text-gray-700 dark:text-gray-300">{a.responsable ?? '\u2014'}</td>
                            <td className="py-1.5 text-gray-700 dark:text-gray-300">{a.delaiPrevu ?? '\u2014'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Section 6: collegial signatures */}
                {section.numeroSection === NumeroSection.SECTION_6 && section.signatairesCollegiaux.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {section.signatairesCollegiaux.map(c => (
                      <div key={c.id} className="flex items-center justify-between text-sm border border-gray-200 dark:border-gray-600 rounded-lg p-3 bg-gray-50 dark:bg-gray-700/30">
                        <span className="font-medium text-gray-900 dark:text-white">{c.roleAttendu}</span>
                        <span className="text-gray-500 dark:text-gray-400">{c.signataireDesigneNom ?? '\u2014'}</span>
                        {c.signee ? (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300">
                            {c.signataireEffectifNom} — {c.dateSignature?.substring(0, 10)}
                          </span>
                        ) : isActive && currentUser ? (
                          <button
                            onClick={() => handleSignCollegiale(c.roleAttendu as RoleCollegial)}
                            disabled={signingSection === `6-${c.roleAttendu}`}
                            className="px-3 py-1.5 bg-[#FF6B35] text-white rounded-lg text-xs font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors shadow-sm">
                            {t('evenements.sign')}
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">{t('evenements.pending')}</span>
                        )}
                      </div>
                    ))}
                    {section.necessiteCapa !== null && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 pl-1">
                        CAPA : {section.necessiteCapa ? t('evenements.oui') : t('evenements.non')}
                      </div>
                    )}
                  </div>
                )}

                {/* Sign button (non-section-6) */}
                {!section.signee && isActive && section.numeroSection !== NumeroSection.SECTION_6 && currentUser && (
                  <button
                    onClick={() => handleSignSection(Number(sectionNum))}
                    disabled={signingSection === sectionNum}
                    className="mt-2 px-5 py-2 bg-[#FF6B35] text-white rounded-lg text-sm font-medium hover:bg-[#e55a2b] disabled:opacity-50 transition-colors shadow-sm">
                    {t('evenements.signSection')}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </PageContainer>
  )
}
