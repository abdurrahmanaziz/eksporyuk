/**
 * Helper to parse membership features from DB
 * 
 * DB stores features in one of two formats:
 * 1. New format: { tags: string[], benefits: string[] }
 * 2. Old format: string[] (flat array)
 * 
 * This helper normalizes both formats for consistent usage
 */

export interface ParsedFeatures {
  tags: string[];      // Badge style features
  benefits: string[];  // Checkmark style features
  all: string[];       // Combined for backward compatibility
}

export function parseMembershipFeatures(features: any): ParsedFeatures {
  if (!features) {
    return { tags: [], benefits: [], all: [] };
  }

  let data = features;

  // Parse if string
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return { tags: [], benefits: [], all: [] };
    }
  }

  // New format: object with tags and benefits
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const tags = Array.isArray(data.tags) ? data.tags : [];
    const benefits = Array.isArray(data.benefits) ? data.benefits : [];
    return {
      tags,
      benefits,
      all: [...tags, ...benefits]
    };
  }

  // Old format: flat array - treat all as benefits
  if (Array.isArray(data)) {
    const uniqueItems = [...new Set(data as string[])];
    return {
      tags: [],
      benefits: uniqueItems,
      all: uniqueItems
    };
  }

  return { tags: [], benefits: [], all: [] };
}

/**
 * Get features as flat array (for backward compatibility)
 */
export function getFeaturesArray(features: any): string[] {
  return parseMembershipFeatures(features).all;
}
