import { Navigate, useParams } from 'react-router-dom'

interface RedirectWithIdProps {
  toBase: string
  suffix?: string
}

/** Redirige une ancienne route avec :id vers une nouvelle base, en preservant l'id. */
export function RedirectWithId({ toBase, suffix = '' }: RedirectWithIdProps) {
  const { id } = useParams<{ id: string }>()
  return <Navigate to={`${toBase}/${id}${suffix}`} replace />
}
