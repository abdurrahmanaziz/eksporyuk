/**
 * Null Safety Utilities
 * 
 * Common utilities to prevent null/undefined errors in React components
 */

export const safeAccess = {
  /**
   * Safely access user name with fallback
   */
  userName: (user: any): string => {
    return user?.name || user?.email?.split('@')[0] || 'User'
  },

  /**
   * Safely access group name with fallback
   */
  groupName: (group: any): string => {
    return group?.name || 'Grup Tidak Diketahui'
  },

  /**
   * Safely access user avatar initial
   */
  userInitial: (user: any): string => {
    const name = safeAccess.userName(user)
    return name.charAt(0).toUpperCase()
  },

  /**
   * Safely access group avatar initial
   */
  groupInitial: (group: any): string => {
    const name = safeAccess.groupName(group)
    return name.charAt(0).toUpperCase()
  },

  /**
   * Safely access nested object properties
   */
  get: (obj: any, path: string, defaultValue: any = null): any => {
    const keys = path.split('.')
    let result = obj
    
    for (const key of keys) {
      if (result == null) return defaultValue
      result = result[key]
    }
    
    return result !== undefined ? result : defaultValue
  },

  /**
   * Map array with null safety
   */
  mapSafe: <T, R>(
    array: T[] | null | undefined, 
    callback: (item: NonNullable<T>, index: number) => R,
    defaultValue: R[] = []
  ): R[] => {
    if (!Array.isArray(array)) return defaultValue
    return array.filter(item => item != null).map(callback)
  },

  /**
   * Safe string truncation
   */
  truncate: (str: string | null | undefined, maxLength: number = 50): string => {
    if (!str) return ''
    return str.length > maxLength ? `${str.substring(0, maxLength)}...` : str
  }
}

export default safeAccess