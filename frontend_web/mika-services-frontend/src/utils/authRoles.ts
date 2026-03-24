/**
 * Rôles effectifs pour l’UI : priorité au profil Redux (getMe), repli sur le claim JWT
 * si les rôles ne sont pas présents (ex. cache partiel, ancienne session).
 * Aligné sur le backend : claim "roles" = codes sans préfixe ROLE_.
 */
export function parseJwtRoleCodes(accessToken: string | null | undefined): string[] {
  if (!accessToken) return []
  try {
    const parts = accessToken.split('.')
    if (parts.length < 2) return []
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) base64 += '='.repeat(4 - pad)
    const json = JSON.parse(atob(base64)) as { roles?: unknown }
    const roles = json?.roles
    if (!Array.isArray(roles)) return []
    return roles.map((r) => String(r))
  } catch {
    return []
  }
}

export function getEffectiveRoleCodes(
  user: { roles?: { code: string }[] } | null | undefined,
  accessToken: string | null | undefined
): string[] {
  const fromUser = user?.roles?.map((r) => r.code).filter(Boolean) ?? []
  if (fromUser.length > 0) return fromUser
  return parseJwtRoleCodes(accessToken)
}

export function hasGlobalAdminRoleEffective(
  user: { roles?: { code: string }[] } | null | undefined,
  accessToken: string | null | undefined
): boolean {
  return getEffectiveRoleCodes(user, accessToken).some((c) => c === 'ADMIN' || c === 'SUPER_ADMIN')
}

export function hasChefProjetRoleEffective(
  user: { roles?: { code: string }[] } | null | undefined,
  accessToken: string | null | undefined
): boolean {
  return getEffectiveRoleCodes(user, accessToken).some((c) => c === 'CHEF_PROJET')
}

/** Aligné sur CurrentUserService.canEditProjet : admin, ou CHEF_PROJET + responsable du projet. */
export function canEditProjetEffective(
  user: { id?: number; roles?: { code: string }[] } | null | undefined,
  accessToken: string | null | undefined,
  responsableProjetId: number | null | undefined
): boolean {
  if (!user?.id) return false
  const codes = getEffectiveRoleCodes(user, accessToken)
  if (codes.some((c) => c === 'ADMIN' || c === 'SUPER_ADMIN')) return true
  if (!codes.some((c) => c === 'CHEF_PROJET')) return false
  return responsableProjetId != null && responsableProjetId === user.id
}

/** Désactivation projet : réservé aux administrateurs (aligné backend). */
export function canDeleteProjetEffective(
  user: { roles?: { code: string }[] } | null | undefined,
  accessToken: string | null | undefined
): boolean {
  return hasGlobalAdminRoleEffective(user, accessToken)
}
