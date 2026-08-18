import { useEffect, useState } from 'react'
import { enginApi } from '@/api/enginApi'
import { useToast } from '@/contexts/ToastContext'

interface Props {
  enginId: number
  enginCode: string
  enginNom: string
  onClose: () => void
}

export function QrCodeModal({ enginId, enginCode, enginNom, onClose }: Props) {
  const toast = useToast()
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let objectUrl: string | null = null
    enginApi.getQrCodeBlob(enginId, 400)
      .then(blob => { objectUrl = URL.createObjectURL(blob); setQrUrl(objectUrl) })
      .catch(() => setError(true))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [enginId])

  const handlePrint = () => {
    if (!qrUrl) return
    const win = window.open('', '_blank', 'width=480,height=640')
    if (!win) { toast({ message: 'Autoriser les pop-ups pour imprimer', variant: 'warning' }); return }
    win.document.write(`<!DOCTYPE html><html><head><title>QR ${enginCode}</title><style>
      body{font-family:Arial,sans-serif;text-align:center;padding:32px;margin:0}
      img{width:300px;height:300px;border:1px solid #ddd;border-radius:8px}
      h1{font-size:22px;margin:18px 0 4px}
      p{font-size:14px;color:#555;margin:0 0 8px}
      .hint{font-size:11px;color:#999;margin-top:14px}
    </style></head><body>
      <img src="${qrUrl}" alt="QR Code" />
      <h1>${enginCode}</h1>
      <p>${enginNom.replace(/</g, '&lt;')}</p>
      <p class="hint">Scanner ce code pour acc&eacute;der &agrave; la fiche de l'&eacute;quipement — MIKA Services</p>
      <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 200); }<\/script>
    </body></html>`)
    win.document.close()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">QR Code équipement</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{enginCode} · {enginNom}</p>
          </div>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="px-6 py-6 flex flex-col items-center gap-3">
          {error ? (
            <div className="text-sm text-red-600 dark:text-red-400 py-10">Erreur lors de la génération du QR code</div>
          ) : qrUrl ? (
            <>
              <img src={qrUrl} alt={`QR code ${enginCode}`} className="w-56 h-56 rounded-lg border border-gray-200 dark:border-gray-600" />
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900 dark:text-white">{enginCode}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">À coller sur l'équipement — un scan ouvre sa fiche</div>
              </div>
            </>
          ) : (
            <div className="w-56 h-56 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse" />
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
          <button type="button" onClick={() => enginApi.getQrCode(enginId).catch(() => toast({ message: 'Erreur téléchargement', variant: 'error' }))} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150">Télécharger PNG</button>
          <button type="button" onClick={handlePrint} disabled={!qrUrl} className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors duration-150 shadow-sm shadow-primary/20">Imprimer</button>
        </div>
      </div>
    </div>
  )
}
