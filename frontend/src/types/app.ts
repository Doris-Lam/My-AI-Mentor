import type { CodeVisualizationResponse, CodeDiagramResponse } from '../services/api';
import type { CodeAnalysisResponse } from './index';

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

