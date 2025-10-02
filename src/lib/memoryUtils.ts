/**
 * Memory utilities for Study/Research modes and Fun mode deduplication
 */

export interface StudyMemoryItem {
  prompt: string;
  summary: string;
  timestamp: number;
}

export interface FunModeItem {
  type: string;
  content: string;
  timestamp: number;
}

const STUDY_MEMORY_KEY = 'study_memory';
const FUN_MEMORY_KEY = 'fun_mode_recent';
const MAX_STUDY_MEMORY = 2;
const MAX_FUN_MEMORY = 10;

/**
 * Save a study/research interaction to memory
 */
export const saveStudyMemory = (userId: string, prompt: string, reply: string): void => {
  try {
    const key = `${STUDY_MEMORY_KEY}_${userId}`;
    const existing = getStudyMemory(userId);
    
    // Create summary (first 200 chars of reply)
    const summary = reply.length > 200 ? reply.substring(0, 200) + '...' : reply;
    
    const newItem: StudyMemoryItem = {
      prompt,
      summary,
      timestamp: Date.now(),
    };
    
    // Keep only last N items
    const updated = [newItem, ...existing].slice(0, MAX_STUDY_MEMORY);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving study memory:', error);
  }
};

/**
 * Get recent study/research memory for a user
 */
export const getStudyMemory = (userId: string): StudyMemoryItem[] => {
  try {
    const key = `${STUDY_MEMORY_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as StudyMemoryItem[];
    // Filter out items older than 1 hour
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    return items.filter(item => item.timestamp > oneHourAgo);
  } catch (error) {
    console.error('Error getting study memory:', error);
    return [];
  }
};

/**
 * Format study memory as context string for prompt
 */
export const formatStudyMemoryContext = (userId: string): string => {
  const memory = getStudyMemory(userId);
  if (memory.length === 0) return '';
  
  let context = 'Previous Q&A context:\n';
  memory.forEach((item, index) => {
    context += `${index + 1}. Q: ${item.prompt}\n   A: ${item.summary}\n`;
  });
  context += '\nNow answer the new question:\n';
  
  return context;
};

/**
 * Clear study memory for a user
 */
export const clearStudyMemory = (userId: string): void => {
  try {
    const key = `${STUDY_MEMORY_KEY}_${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing study memory:', error);
  }
};

/**
 * Save a fun mode item to prevent repetition
 */
export const saveFunModeItem = (userId: string, type: string, content: string): void => {
  try {
    const key = `${FUN_MEMORY_KEY}_${userId}`;
    const existing = getFunModeItems(userId);
    
    const newItem: FunModeItem = {
      type,
      content: content.toLowerCase().trim(),
      timestamp: Date.now(),
    };
    
    // Keep only last N items
    const updated = [newItem, ...existing].slice(0, MAX_FUN_MEMORY);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving fun mode item:', error);
  }
};

/**
 * Get recent fun mode items
 */
export const getFunModeItems = (userId: string): FunModeItem[] => {
  try {
    const key = `${FUN_MEMORY_KEY}_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const items = JSON.parse(stored) as FunModeItem[];
    // Filter out items older than 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return items.filter(item => item.timestamp > oneDayAgo);
  } catch (error) {
    console.error('Error getting fun mode items:', error);
    return [];
  }
};

/**
 * Check if a fun mode response is a duplicate
 */
export const isDuplicateFunResponse = (userId: string, content: string): boolean => {
  try {
    const recent = getFunModeItems(userId);
    const normalized = content.toLowerCase().trim();
    
    // Check for exact or very similar matches
    return recent.some(item => {
      const similarity = calculateSimilarity(item.content, normalized);
      return similarity > 0.8; // 80% similarity threshold
    });
  } catch (error) {
    console.error('Error checking duplicate fun response:', error);
    return false;
  }
};

/**
 * Simple similarity calculation (Levenshtein-based approximation)
 */
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  // Quick check: if one contains the other, very similar
  if (longer.includes(shorter) || shorter.includes(longer)) return 0.9;
  
  // Count matching words
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  const commonWords = words1.filter(w => words2.includes(w));
  
  return (commonWords.length * 2) / (words1.length + words2.length);
};

/**
 * Clear fun mode memory for a user
 */
export const clearFunModeMemory = (userId: string): void => {
  try {
    const key = `${FUN_MEMORY_KEY}_${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing fun mode memory:', error);
  }
};

/**
 * Get memory context prompt for Fun mode
 */
export const getFunModeContext = (userId: string): string => {
  const recent = getFunModeItems(userId);
  if (recent.length === 0) return '';
  
  const recentContent = recent.map(item => item.content.substring(0, 50)).join(', ');
  return `Recent responses (avoid repeating): ${recentContent}`;
};
