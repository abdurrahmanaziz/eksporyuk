// Moderation utilities
export function containsBannedWords(content: string, bannedWords: string[]): boolean {
  if (!bannedWords || bannedWords.length === 0) return false
  
  const lowerContent = content.toLowerCase()
  return bannedWords.some(word => 
    lowerContent.includes(word.toLowerCase())
  )
}

export function filterBannedWords(content: string, bannedWords: string[]): string {
  if (!bannedWords || bannedWords.length === 0) return content
  
  let filtered = content
  bannedWords.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '***')
  })
  
  return filtered
}

export function getBannedWordsFound(content: string, bannedWords: string[]): string[] {
  if (!bannedWords || bannedWords.length === 0) return []
  
  const lowerContent = content.toLowerCase()
  return bannedWords.filter(word => 
    lowerContent.includes(word.toLowerCase())
  )
}
