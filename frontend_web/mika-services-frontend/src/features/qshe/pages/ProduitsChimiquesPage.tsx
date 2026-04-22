import { useEffect, useState } from 'react'
import { qsheEnvApi } from '@/api/qsheEnvironnementApi'
import type { ProduitChimiqueResponse, ProduitChimiqueCreateRequest } from '@/types/qsheEnvironnement'
import { PageContainer } from '@/components/layout/PageContainer'

const CARD = 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm overflow-hidden'

export default function ProduitsChimiquesPage() {
  const [produits, setProduits] = useState<ProduitChimiqueResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [fCode, setFCode] = useState('')
  const [fNom, setFNom] = useState('')
  const [fFournisseur, setFFournisseur] = useState('')
  const [fPicto, setFPicto] = useState('')
  const [fEpi, setFEpi] = useState('')
  const [fDateFds, setFDateFds] = useState('')

  const load = () => { setLoading(true); qsheEnvApi.getProduits().then(r => setProduits(r.content)).finally(() => setLoading(false)) }
  useEffect(load, [])

  const handleCreate = async () => {
    if (!fCode.trim() || !fNom.trim()) return
    const req: ProduitChimiqueCreateRequest = {
      code: fCode.trim(), nomCommercial: fNom.trim(),
      fournisseur: fFournisseur.trim() || undefined,
      pictogrammesGhs: fPicto.trim() || undefined,
      epiRequis: fEpi.trim() || undefined,
      dateFds: fDateFds || undefined,
    }
    await qsheEnvApi.createProduit(req)
    setShowForm(false); setFCode(''); setFNom(''); setFFournisseur(''); setFPicto(''); setFEpi(''); setFDateFds('')
    load()
  }

  return (
    <PageContainer size="full" className="space-y-4 sm:space-y-6 bg-gray-50/80 dark:bg-gray-900/80">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Produits chimiques (FDS)</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Inventaire, fiches de données de sécurité, pictogrammes GHS</p></div>
        <button onClick={() => setShowForm(true)}
          className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary-dark font-medium shadow-sm transition flex items-center gap-2 self-start sm:self-auto">
          <span className="text-lg leading-none">+</span> Nouveau produit
        </button>
      </div>

      <div className={CARD}>
        {loading ? <div className="p-8 text-center text-gray-400">Chargement...</div>
        : produits.length === 0 ? <div className="p-8 text-center text-gray-400">Aucun produit chimique enregistré.</div>
        : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {produits.map(p => (
              <div key={p.id} className={`px-4 py-3 sm:px-5 sm:py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${p.fdsObsolete ? 'border-l-4 border-l-orange-400' : ''}`}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-mono text-gray-400">{p.code}</span>
                      <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm">{p.nomCommercial}</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-xs mt-1">
                      {p.pictogrammesGhs && p.pictogrammesGhs.split(',').map(g => (
                        <span key={g} className="px-2 py-0.5 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-200 font-medium">{g.trim()}</span>
                      ))}
                      {p.fournisseur && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{p.fournisseur}</span>}
                      {p.epiRequis && <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700">EPI: {p.epiRequis}</span>}
                      {p.dateFds && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">FDS: {p.dateFds}</span>}
                      {p.fdsObsolete && <span className="px-2 py-0.5 rounded-md bg-orange-500 text-white font-bold">FDS obsolète (&gt;3 ans)</span>}
                      {p.localisationStockage && <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">{p.localisationStockage}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:border dark:border-gray-600 w-full max-w-lg p-5 sm:p-6 my-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Nouveau produit chimique</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code *</label>
                  <input type="text" value={fCode} onChange={e => setFCode(e.target.value)} placeholder="PC-001"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom commercial *</label>
                  <input type="text" value={fNom} onChange={e => setFNom(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fournisseur</label>
                <input type="text" value={fFournisseur} onChange={e => setFFournisseur(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pictogrammes GHS</label>
                  <input type="text" value={fPicto} onChange={e => setFPicto(e.target.value)} placeholder="GHS02,GHS07"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
                <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date FDS</label>
                  <input type="date" value={fDateFds} onChange={e => setFDateFds(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EPI requis</label>
                <input type="text" value={fEpi} onChange={e => setFEpi(e.target.value)}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100" /></div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 text-sm">Annuler</button>
              <button onClick={handleCreate} disabled={!fCode.trim() || !fNom.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm font-medium">Créer</button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  )
}
