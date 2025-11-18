export interface CodeAnalysisRequest {
  code: string;
  language: string;
  format?: boolean;
}

export interface CodeAnalysisResponse {
  id: number;
  errors: string;
  suggestions: string;
  test_cases: string;
  explanation: string;
  formatted_code?: string;
  correctness_score?: number;
  clarity_score?: number;
  best_practices_score?: number;
  performance_score?: number;
  overall_score?: number;
  created_at: string;
}

export interface SubmissionHistory {
  id: number;
  code: string;
  language: string;
  errors: string;
  suggestions: string;
  test_cases: string;
  explanation: string;
  created_at: string;
}

