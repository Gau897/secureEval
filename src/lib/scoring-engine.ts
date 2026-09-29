import { TestCase, EvaluationRun } from '@/types';
import { ModelAuditResponse } from './ai-connector';

export interface ScoringResult {
  score_detection: number; // 0 or 40
  score_cwe: number;       // 0 or 20
  score_localization: number; // 0 to 20
  score_patch: number;     // 0 to 20
  total_score: number;     // 0 to 100
  correct_cwe: boolean;
  correct_lines: boolean;
  patch_secure: boolean;
}

/**
 * Deterministic Scoring Rubric Engine
 * Measures AI model vulnerability auditing against ground-truth security benchmarks
 */
export function scoreModelAudit(
  testCase: TestCase,
  auditResponse: ModelAuditResponse,
  modelId: string
): EvaluationRun {
  // 1. Vulnerability Detection (40 Points Max)
  const detected = Boolean(auditResponse.detected_vulnerability);
  const score_detection = detected ? 40 : 0;

  // 2. CWE Classification Accuracy (20 Points Max)
  const expectedCweClean = testCase.cwe_id.trim().toUpperCase();
  const identifiedCweClean = (auditResponse.identified_cwe || '').trim().toUpperCase();
  const correct_cwe = detected && (
    identifiedCweClean.includes(expectedCweClean) || 
    expectedCweClean.includes(identifiedCweClean)
  );
  const score_cwe = correct_cwe ? 20 : 0;

  // 3. Vulnerability Line Localization Accuracy (20 Points Max)
  const expectedLines = new Set(testCase.vulnerability_lines);
  const modelLines = new Set(auditResponse.identified_lines || []);
  let lineOverlapCount = 0;
  expectedLines.forEach(line => {
    if (modelLines.has(line)) lineOverlapCount++;
  });

  const correct_lines = detected && lineOverlapCount > 0;
  const lineAccuracyRatio = expectedLines.size > 0 ? (lineOverlapCount / expectedLines.size) : 0;
  const score_localization = detected ? Math.round(lineAccuracyRatio * 20) : 0;

  // 4. Secure Remediation / Patch Validation (20 Points Max)
  const patchProvided = Boolean(auditResponse.suggested_patch && auditResponse.suggested_patch.length > 10);
  let patch_secure = false;

  if (detected && patchProvided) {
    const patchLower = (auditResponse.suggested_patch || '').toLowerCase();
    
    // Validate that patch doesn't repeat the vulnerable pattern
    const vulnKeywords: Record<string, string[]> = {
      'CWE-89': ['f"', "f'", '%s', 'select * from users where status = \''],
      'CWE-918': ['169.254.169.254', 'localhost', '127.0.0.1'],
      'CWE-502': ['pickle.loads', 'unserialize'],
      'CWE-798': ['super_secret_jwt', 'hardcoded'],
      'CWE-22': ['path.join(reportsdir, filename)'],
      'CWE-327': ['modes.ecb']
    };

    const badPatterns = vulnKeywords[expectedCweClean] || [];
    const hasBadPattern = badPatterns.some(pat => patchLower.includes(pat));
    patch_secure = !hasBadPattern;
  }

  const score_patch = patch_secure ? 20 : (patchProvided && detected ? 10 : 0);

  // Total Score (0 - 100)
  const total_score = score_detection + score_cwe + score_localization + score_patch;

  return {
    id: `eval-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    test_case_id: testCase.id,
    model_id: modelId,
    prompt_used: `Audit the code snippet for ${testCase.cwe_name} and identify root cause lines.`,
    raw_response: auditResponse.raw_response,
    detected_vulnerability: detected,
    identified_cwe: auditResponse.identified_cwe,
    correct_cwe,
    identified_lines: auditResponse.identified_lines,
    correct_lines,
    patch_provided: patchProvided,
    patch_secure,
    patch_code: auditResponse.suggested_patch,
    score_detection,
    score_cwe,
    score_localization,
    score_patch,
    total_score,
    latency_ms: auditResponse.latency_ms,
    timestamp: new Date().toISOString()
  };
}
