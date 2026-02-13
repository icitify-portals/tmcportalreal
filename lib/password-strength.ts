/**
 * Calculate password strength (0-100)
 * Requirements:
 * - Uppercase letter
 * - Lowercase letter
 * - Number
 * - Special character
 * - Minimum 70% strength required
 */
export function calculatePasswordStrength(password: string): {
  strength: number
  percentage: number
  requirements: {
    length: boolean
    uppercase: boolean
    lowercase: boolean
    number: boolean
    specialChar: boolean
  }
  isValid: boolean
} {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  }

  // Calculate strength based on requirements met
  const metCount = Object.values(requirements).filter(Boolean).length
  const baseStrength = (metCount / 5) * 60 // 60% for meeting all requirements

  // Additional strength based on length
  let lengthBonus = 0
  if (password.length >= 12) lengthBonus = 20
  else if (password.length >= 10) lengthBonus = 15
  else if (password.length >= 8) lengthBonus = 10

  // Additional strength based on character variety
  const uniqueChars = new Set(password).size
  const varietyBonus = Math.min((uniqueChars / password.length) * 20, 20)

  const totalStrength = Math.min(baseStrength + lengthBonus + varietyBonus, 100)
  const percentage = Math.round(totalStrength)

  // Password is valid if all requirements are met AND strength >= 70%
  const isValid = 
    requirements.length &&
    requirements.uppercase &&
    requirements.lowercase &&
    requirements.number &&
    requirements.specialChar &&
    percentage >= 70

  return {
    strength: totalStrength,
    percentage,
    requirements,
    isValid,
  }
}

export function getPasswordStrengthColor(percentage: number): string {
  if (percentage >= 70) return "text-green-500"
  if (percentage >= 50) return "text-yellow-500"
  return "text-red-500"
}

export function getPasswordStrengthLabel(percentage: number): string {
  if (percentage >= 70) return "Strong"
  if (percentage >= 50) return "Medium"
  if (percentage >= 30) return "Weak"
  return "Very Weak"
}


