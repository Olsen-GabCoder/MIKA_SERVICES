import type { User } from '@/types'

export function getRoleLabel(user: User): string {
  const role = user.roles?.[0]
  if (!role) return 'Utilisateur'
  const code = role.code?.toUpperCase()
  if (code === 'ADMIN' || code === 'SUPER_ADMIN') return 'Admin'
  if (code === 'CHEF_PROJET') return 'Chef de projet'
  if (code === 'MANAGER') return 'Manager'
  return role.nom || 'Employé'
}

export function getInitials(user: User): string {
  const p = (user.prenom || '').trim()
  const n = (user.nom || '').trim()
  if (p && n) return `${p[0]}${n[0]}`.toUpperCase()
  if (n) return n.slice(0, 2).toUpperCase()
  if (user.email) return user.email.slice(0, 2).toUpperCase()
  return '?'
}

export function photoSrc(photo: string | undefined): string | null {
  if (!photo?.trim()) return null
  if (photo.startsWith('http')) return photo
  return photo.startsWith('/') ? photo : `/${photo.replace(/^\//, '')}`
}

export function fullName(user: User): string {
  return [user.prenom, user.nom].filter(Boolean).join(' ') || user.email || 'Utilisateur'
}
