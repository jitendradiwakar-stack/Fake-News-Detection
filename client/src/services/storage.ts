import { DetectionResult } from './detection';

const STORAGE_KEY = 'truth-beacon-history';
const MAX_HISTORY_ITEMS = 50;

export class StorageService {
  /**
   * Save detection results to localStorage
   */
  static saveResults(results: DetectionResult[]): void {
    try {
      const limitedResults = results.slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedResults));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load detection results from localStorage
   */
  static loadResults(): DetectionResult[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      
      // Convert timestamp strings back to Date objects
      return parsed.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  }

  /**
   * Add a new result to the history
   */
  static addResult(result: DetectionResult): DetectionResult[] {
    const existing = this.loadResults();
    const updated = [result, ...existing].slice(0, MAX_HISTORY_ITEMS);
    this.saveResults(updated);
    return updated;
  }

  /**
   * Delete a result by ID
   */
  static deleteResult(id: string): DetectionResult[] {
    const existing = this.loadResults();
    const updated = existing.filter((item) => item.id !== id);
    this.saveResults(updated);
    return updated;
  }

  /**
   * Clear all history
   */
  static clearHistory(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Get history count
   */
  static getHistoryCount(): number {
    return this.loadResults().length;
  }
}
