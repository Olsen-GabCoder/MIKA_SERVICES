/**
 * EnginDetailPage — redirige vers la page principale du module materiel
 * (la fiche equipement est integree dans EnginListPage via navigation interne).
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function EnginDetailPage() {
  const navigate = useNavigate()
  useEffect(() => { navigate('/engins', { replace: true }) }, [navigate])
  return null
}
