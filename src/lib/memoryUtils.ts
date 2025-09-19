/**
 * Memory utilities for Study/Research modes and Fun Mode de-duplication
 */

export interface StudyMemoryItem {
  question: string;
  summary: string;
  timestamp: number;
  mode: string;
}

export interface FunItem {
  id: string;
  content: string;
  type: 'joke' | 'riddle' | 'fact' | 'compliment';
  timestamp: number;
}

/**
 * Study/Research Mode Memory Functions
 */
export function saveStudyMemory(userId: string, question: string, response: string, mode: string) {
  try {
    const key = `study_memory_${userId}`;
    const existing = getStudyMemory(userId);
    
    // Create summary (first 200 chars of response)
    const summary = response.length > 200 
      ? response.substring(0, 200) + '...' 
      : response;
    
    const newItem: StudyMemoryItem = {
      question: question.substring(0, 100), // Limit question length
      summary,
      timestamp: Date.now(),
      mode
    };
    
    // Keep only last 2 items
    const updated = [newItem, ...existing].slice(0, 2);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save study memory:', error);
  }
}

export function getStudyMemory(userId: string): StudyMemoryItem[] {
  try {
    const key = `study_memory_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const items: StudyMemoryItem[] = JSON.parse(stored);
    
    // Filter out items older than 24 hours
    const cutoff = Date.now() - (24 * 60 * 60 * 1000);
    return items.filter(item => item.timestamp > cutoff);
  } catch (error) {
    console.warn('Failed to get study memory:', error);
    return [];
  }
}

export function formatStudyContext(userId: string): string {
  const memory = getStudyMemory(userId);
  if (memory.length === 0) return '';
  
  const contextLines = memory.map(item => 
    `Previous ${item.mode}: \"${item.question}\" -> ${item.summary}`
  );
  
  return `Context from recent questions:\n${contextLines.join('\n')}\n\n`;
}

/**
 * Fun Mode De-duplication Functions
 */
export function saveFunItem(userId: string, item: FunItem) {
  try {
    const key = `fun_items_${userId}`;
    const existing = getFunItems(userId);
    
    // Add new item and keep last 20
    const updated = [item, ...existing].slice(0, 20);
    
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.warn('Failed to save fun item:', error);
  }
}

export function getFunItems(userId: string): FunItem[] {
  try {
    const key = `fun_items_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const items: FunItem[] = JSON.parse(stored);
    
    // Filter out items older than 7 days
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return items.filter(item => item.timestamp > cutoff);
  } catch (error) {
    console.warn('Failed to get fun items:', error);
    return [];
  }
}

export function isDuplicateFunItem(userId: string, content: string, type: FunItem['type']): boolean {
  const existing = getFunItems(userId);
  
  // Check for exact matches or very similar content
  return existing.some(item => 
    item.type === type && (
      item.content === content ||
      similarity(item.content.toLowerCase(), content.toLowerCase()) > 0.8
    )
  );
}

export function generateFunItemId(content: string, type: FunItem['type']): string {
  // Create a simple hash-like ID
  const hash = content.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  
  return `${type}_${Math.abs(hash)}_${Date.now()}`;
}

/**
 * Simple string similarity function
 */
function similarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Clear all memory (for testing or user privacy)
 */
export function clearAllMemory(userId: string) {
  try {
    localStorage.removeItem(`study_memory_${userId}`);
    localStorage.removeItem(`fun_items_${userId}`);
  } catch (error) {
    console.warn('Failed to clear memory:', error);
  }
}
