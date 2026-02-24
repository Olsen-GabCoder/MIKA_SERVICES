/**
 * Politique de complexité du mot de passe (alignée sur le backend).
 * Au moins 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
 */
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/

export const validatePassword = (password: string): string | null => {
  if (!password || password.length < 8) {
    return 'passwordRequirements.minLength'
  }
  if (!/[a-z]/.test(password)) {
    return 'passwordRequirements.lowercase'
  }
  if (!/[A-Z]/.test(password)) {
    return 'passwordRequirements.uppercase'
  }
  if (!/\d/.test(password)) {
    return 'passwordRequirements.digit'
  }
  if (!/[^a-zA-Z\d]/.test(password)) {
    return 'passwordRequirements.special'
  }
  return null
}

export const isPasswordValid = (password: string): boolean => {
  return PASSWORD_REGEX.test(password)
}
