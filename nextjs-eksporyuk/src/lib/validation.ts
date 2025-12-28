/**
 * Form Validation Utilities
 * Provides comprehensive validation for course creation forms
 */

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  min?: number
  max?: number
  custom?: (value: any) => string | null
}

export interface ValidationField {
  [key: string]: ValidationRule
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string[]>
  firstError?: string
}

export class FormValidator {
  private rules: ValidationField = {}

  constructor(rules?: ValidationField) {
    if (rules) {
      this.rules = rules
    }
  }

  // Add validation rule for a field
  setRule(field: string, rule: ValidationRule): void {
    this.rules[field] = rule
  }

  // Validate a single field
  validateField(field: string, value: any, allData?: Record<string, any>): string[] {
    const rule = this.rules[field]
    if (!rule) return []

    const errors: string[] = []

    // Required validation
    if (rule.required && this.isEmpty(value)) {
      errors.push(`${this.getFieldLabel(field)} wajib diisi`)
      return errors // Stop here if required field is empty
    }

    // Skip other validations if field is empty and not required
    if (this.isEmpty(value)) return errors

    // String validations
    if (typeof value === 'string') {
      if (rule.minLength && value.length < rule.minLength) {
        errors.push(`${this.getFieldLabel(field)} minimal ${rule.minLength} karakter`)
      }
      if (rule.maxLength && value.length > rule.maxLength) {
        errors.push(`${this.getFieldLabel(field)} maksimal ${rule.maxLength} karakter`)
      }
      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`Format ${this.getFieldLabel(field).toLowerCase()} tidak valid`)
      }
    }

    // Number validations
    if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
      const numValue = Number(value)
      if (rule.min !== undefined && numValue < rule.min) {
        errors.push(`${this.getFieldLabel(field)} minimal ${rule.min}`)
      }
      if (rule.max !== undefined && numValue > rule.max) {
        errors.push(`${this.getFieldLabel(field)} maksimal ${rule.max}`)
      }
    }

    // Custom validation - pass all data for context
    if (rule.custom) {
      const customError = rule.custom(value, allData)
      if (customError) {
        errors.push(customError)
      }
    }

    return errors
  }

  // Validate entire form
  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string[]> = {}
    let isValid = true

    for (const field in this.rules) {
      const fieldErrors = this.validateField(field, data[field], data)
      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
        isValid = false
      }
    }

    const allErrors = Object.values(errors).flat()
    const firstError = allErrors.length > 0 ? allErrors[0] : undefined

    return { isValid, errors, firstError }
  }

  // Check if value is empty
  private isEmpty(value: any): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string' && value.trim() === '') return true
    if (Array.isArray(value) && value.length === 0) return true
    return false
  }

  // Get human-readable field label
  private getFieldLabel(field: string): string {
    const labels: Record<string, string> = {
      title: 'Judul',
      slug: 'Slug',
      description: 'Deskripsi',
      price: 'Harga',
      originalPrice: 'Harga Asli',
      duration: 'Durasi',
      level: 'Level',
      monetizationType: 'Tipe Monetisasi',
      mentorId: 'Mentor',
      groupId: 'Group',
      thumbnail: 'Thumbnail',
      mailketingListId: 'Mailketing List ID',
      mailketingListName: 'Nama Mailketing List',
      affiliateCommissionRate: 'Komisi Affiliate'
    }
    return labels[field] || field
  }
}

// Pre-defined validation rules for common fields
export const courseValidationRules: ValidationField = {
  title: {
    required: true,
    minLength: 3,
    maxLength: 200,
    custom: (value: string) => {
      if (value && /^\s*$/.test(value)) {
        return 'Judul tidak boleh hanya spasi'
      }
      return null
    }
  },
  slug: {
    required: true,
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-z0-9-]+$/,
    custom: (value: string) => {
      if (value && (value.startsWith('-') || value.endsWith('-'))) {
        return 'Slug tidak boleh diawali atau diakhiri dengan tanda hubung'
      }
      return null
    }
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 2000
  },
  price: {
    required: false, // Conditional: only required for PAID type
    min: 0,
    custom: (value: any, data?: Record<string, any>) => {
      // Only validate price if monetizationType is PAID
      if (data?.monetizationType === 'PAID') {
        if (!value || value === '') {
          return 'Harga wajib diisi untuk kursus berbayar'
        }
        const num = Number(value)
        if (isNaN(num)) {
          return 'Harga harus berupa angka'
        }
        if (num < 0) {
          return 'Harga tidak boleh negatif'
        }
      }
      return null
    }
  },
  originalPrice: {
    min: 0,
    custom: (value: any, data?: Record<string, any>) => {
      if (!value) return null
      const num = Number(value)
      if (isNaN(num)) {
        return 'Harga asli harus berupa angka'
      }
      if (data?.price && num < Number(data.price)) {
        return 'Harga asli harus lebih besar dari harga jual'
      }
      return null
    }
  },
  duration: {
    min: 0,
    max: 1000,
    custom: (value: any) => {
      if (!value) return null
      const num = Number(value)
      if (isNaN(num)) {
        return 'Durasi harus berupa angka'
      }
      return null
    }
  },
  level: {
    required: true,
    custom: (value: string) => {
      const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED']
      if (!validLevels.includes(value)) {
        return 'Level harus dipilih'
      }
      return null
    }
  },
  monetizationType: {
    required: true,
    custom: (value: string) => {
      const validTypes = ['FREE', 'PAID', 'MEMBERSHIP', 'AFFILIATE']
      if (!validTypes.includes(value)) {
        return 'Tipe monetisasi harus dipilih'
      }
      return null
    }
  },
  thumbnail: {
    pattern: /^https?:\/\/.+/,
    custom: (value: string) => {
      if (!value) return null
      try {
        new URL(value)
        return null
      } catch {
        return 'URL thumbnail tidak valid'
      }
    }
  },
  mailketingListId: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]*$/
  },
  affiliateCommissionRate: {
    min: 0,
    max: 100,
    custom: (value: any) => {
      if (!value) return null
      const num = Number(value)
      if (isNaN(num)) {
        return 'Komisi affiliate harus berupa angka'
      }
      return null
    }
  }
}

// Utility functions
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateWhatsApp(phone: string): boolean {
  const whatsappRegex = /^(\+62|62|0)[0-9]{8,13}$/
  return whatsappRegex.test(phone.replace(/[^0-9+]/g, ''))
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .replace(/^-|-$/g, '')    // Remove leading/trailing hyphens
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}

// Course-specific validator instance
export const courseValidator = new FormValidator(courseValidationRules)