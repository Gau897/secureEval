export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type ProgrammingLanguage = 'python' | 'javascript' | 'typescript' | 'go' | 'java';

export interface TestCase {
  id: string;
  title: string;
  language: ProgrammingLanguage;
  cwe_id: string;
  cwe_name: string;
  category: 'Injection' | 'Authentication' | 'SSRF & Network' | 'Deserialization' | 'Secrets & Auth' | 'Access Control' | 'Cryptography';
  severity: Severity;
  difficulty: 'easy' | 'medium' | 'hard';
  vulnerable_code: string;
  vulnerability_lines: number[];
  description: string;
  attack_scenario: string;
  expected_patch: string;
  patch_explanation: string;
  tags: string[];
  created_at: string;
}

export interface ModelSnapshot {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Anthropic' | 'Google' | 'DeepSeek' | 'Meta' | 'Mistral';
  version: string;
  context_window_k: number;
  api_model_id: string;
  description: string;
  badge?: string;
}

export interface EvaluationRun {
  id: string;
  test_case_id: string;
  model_id: string;
  prompt_used: string;
  raw_response: string;
  detected_vulnerability: boolean;
  identified_cwe?: string;
  correct_cwe: boolean;
  identified_lines: number[];
  correct_lines: boolean;
  patch_provided: boolean;
  patch_secure: boolean;
  patch_code?: string;
  score_detection: number; // 0 to 40
  score_cwe: number;       // 0 to 20
  score_localization: number; // 0 to 20
  score_patch: number;     // 0 to 20
  total_score: number;     // 0 to 100
  latency_ms: number;
  timestamp: string;
}

export interface ModelBenchmarkSummary {
  model_id: string;
  model_name: string;
  provider: string;
  version: string;
  total_cases: number;
  overall_score: number; // 0 to 100
  detection_rate: number; // percentage
  cwe_accuracy: number; // percentage
  localization_accuracy: number; // percentage
  patch_success_rate: number; // percentage
  avg_latency_ms: number;
  category_scores: {
    category: string;
    score: number;
    detection_rate: number;
  }[];
  severity_scores: {
    severity: Severity;
    score: number;
    total: number;
  }[];
}
