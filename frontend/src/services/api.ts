import axios from 'axios';
import type { CodeAnalysisRequest, CodeAnalysisResponse, SubmissionHistory } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeCode = async (request: CodeAnalysisRequest): Promise<CodeAnalysisResponse> => {
  const response = await api.post<CodeAnalysisResponse>('/api/analyze', request);
  return response.data;
};

export const getHistory = async (limit: number = 10): Promise<SubmissionHistory[]> => {
  const response = await api.get<SubmissionHistory[]>('/api/history', {
    params: { limit },
  });
  return response.data;
};

export const getSubmission = async (id: number): Promise<SubmissionHistory> => {
  const response = await api.get<SubmissionHistory>(`/api/submission/${id}`);
  return response.data;
};

export interface CodeGenerationRequest {
  prompt: string;
  language: string;
  context?: string;
}

export interface CodeGenerationResponse {
  generated_code: string;
  explanation: string;
}

export const generateCode = async (request: CodeGenerationRequest): Promise<CodeGenerationResponse> => {
  const response = await api.post<CodeGenerationResponse>('/api/generate', request);
  return response.data;
};

export interface CodeVisualizationRequest {
  code: string;
  language: string;
}

export interface CodeVisualizationResponse {
  steps: Array<{
    step_number: number;
    line_number: number;
    line_end?: number;
    description: string;
    variables: string | Record<string, any>;
    action: string;
    output: string;
  }>;
  explanation: string;
  flow_diagram?: string;
}

export const visualizeCode = async (request: CodeVisualizationRequest): Promise<CodeVisualizationResponse> => {
  const response = await api.post<CodeVisualizationResponse>('/api/visualize', request);
  return response.data;
};

export interface CodeDiagramRequest {
  code: string;
  language: string;
}

export interface CodeDiagramResponse {
  diagram_code: string;
  diagram_type: string;
  explanation: string;
}

export const generateDiagram = async (request: CodeDiagramRequest): Promise<CodeDiagramResponse> => {
  const response = await api.post<CodeDiagramResponse>('/api/diagram', request);
  return response.data;
};

export interface CodeLessonRequest {
  code: string;
  language: string;
}

export interface CodeLessonResponse {
  lesson: string;
  concepts: string[];
}

export const generateLesson = async (request: CodeLessonRequest): Promise<CodeLessonResponse> => {
  const response = await api.post<CodeLessonResponse>('/api/lesson', request);
  return response.data;
};

export interface CodeFormatRequest {
  code: string;
  language: string;
}

export interface CodeFormatResponse {
  formatted_code: string;
  changes_made: boolean;
}

export const formatCode = async (request: CodeFormatRequest): Promise<CodeFormatResponse> => {
  const response = await api.post<CodeFormatResponse>('/api/format', request);
  return response.data;
};

export interface CodeExecutionRequest {
  code: string;
  language: string;
}

export interface CodeExecutionResponse {
  output: string;
  error?: string;
  exit_code: number;
  execution_time: number;
}

export const executeCode = async (request: CodeExecutionRequest): Promise<CodeExecutionResponse> => {
  const response = await api.post<CodeExecutionResponse>('/api/execute', request);
  return response.data;
};

export interface ShareCodeRequest {
  code: string;
  language: string;
  title?: string;
}

export interface ShareCodeResponse {
  share_id: string;
  share_url: string;
  expires_at?: string;
}

export interface SharedCodeResponse {
  code: string;
  language: string;
  title?: string;
  created_at: string;
}

export const shareCode = async (request: ShareCodeRequest): Promise<ShareCodeResponse> => {
  const response = await api.post<ShareCodeResponse>('/api/share', request);
  return response.data;
};

export const getSharedCode = async (shareId: string): Promise<SharedCodeResponse> => {
  const response = await api.get<SharedCodeResponse>(`/api/share/${shareId}`);
  return response.data;
};

