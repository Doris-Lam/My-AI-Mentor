/**
 * Application Type Definitions
 * 
 * This module defines TypeScript interfaces for the application's data structures.
 * These types ensure type safety throughout the frontend codebase.
 * 
 * Key Types:
 * - Document: Represents a code file/tab with all its state
 * - FeedbackItem: Individual AI suggestion/error
 * - Achievement: Gamification badges
 * - CodeAnalysisResponse: AI analysis results
 */

import type { CodeVisualizationResponse, CodeDiagramResponse } from '../services/api';
import type { CodeAnalysisResponse } from './index';

/**
 * Represents a single feedback item from AI analysis.
 * Can be an error, warning, or suggestion.
 */
export interface FeedbackItem {
  id: string;
  line: number;
  startColumn?: number;
  endColumn?: number;
  type: 'error' | 'warning' | 'suggestion';
  message: string;
  suggestion: string;
  severity: 'high' | 'medium' | 'low';
  originalText?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'milestone' | 'streak' | 'quality' | 'learning';
}

/**
 * Represents a document (code file) in the editor.
 * Each tab in the multi-document workspace is a Document.
 * 
 * Contains:
 * - Code content and language
 * - History for undo/redo
 * - AI feedback and analysis
 * - Visualization and diagram data
 * - Scores and achievements
 * - AI chat messages
 */
export interface Document {
  id: string;
  title: string;
  code: string;
  language: string;
  documentHistory: string[];
  historyIndex: number;
  feedback: FeedbackItem[];
  visualization: CodeVisualizationResponse | null;
  diagram: CodeDiagramResponse | null;
  lesson: string | null;
  aiMessages: Array<{type: 'user' | 'ai', content: string, code?: string}>;
  scores: {
    correctness?: number;
    clarity?: number;
    bestPractices?: number;
    performance?: number;
    overall?: number;
  };
  achievements: Achievement[];
}

export type { CodeAnalysisResponse };

