import { TestCase, ModelSnapshot, EvaluationRun, ModelBenchmarkSummary } from '@/types';
import { SEED_MODELS, SEED_TEST_CASES, SEED_EVALUATION_RUNS } from '@/data/seed-test-cases';

// In-memory / persistent database store
const testCases: TestCase[] = [...SEED_TEST_CASES];
const models: ModelSnapshot[] = [...SEED_MODELS];
const evaluationRuns: EvaluationRun[] = [...SEED_EVALUATION_RUNS];

export const db = {
  // Test Cases
  getTestCases: (filters?: {
    category?: string;
    severity?: string;
    language?: string;
    search?: string;
  }): TestCase[] => {
    let result = [...testCases];
    if (filters?.category && filters.category !== 'all') {
      result = result.filter(tc => tc.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters?.severity && filters.severity !== 'all') {
      result = result.filter(tc => tc.severity.toLowerCase() === filters.severity?.toLowerCase());
    }
    if (filters?.language && filters.language !== 'all') {
      result = result.filter(tc => tc.language.toLowerCase() === filters.language?.toLowerCase());
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        tc =>
          tc.title.toLowerCase().includes(q) ||
          tc.cwe_id.toLowerCase().includes(q) ||
          tc.description.toLowerCase().includes(q) ||
          tc.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return result;
  },

  getTestCaseById: (id: string): TestCase | undefined => {
    return testCases.find(tc => tc.id === id);
  },

  addTestCase: (testCase: TestCase): void => {
    testCases.unshift(testCase);
  },

  // Models
  getModels: (): ModelSnapshot[] => {
    return [...models];
  },

  getModelById: (id: string): ModelSnapshot | undefined => {
    return models.find(m => m.id === id);
  },

  // Evaluation Runs
  getEvaluationRuns: (filters?: { model_id?: string; test_case_id?: string }): EvaluationRun[] => {
    let result = [...evaluationRuns];
    if (filters?.model_id) {
      result = result.filter(r => r.model_id === filters.model_id);
    }
    if (filters?.test_case_id) {
      result = result.filter(r => r.test_case_id === filters.test_case_id);
    }
    return result;
  },

  addEvaluationRun: (run: EvaluationRun): void => {
    const existingIndex = evaluationRuns.findIndex(
      r => r.model_id === run.model_id && r.test_case_id === run.test_case_id
    );
    if (existingIndex >= 0) {
      evaluationRuns[existingIndex] = run;
    } else {
      evaluationRuns.push(run);
    }
  },

  // Aggregated Benchmark Calculation
  getBenchmarkSummaries: (): ModelBenchmarkSummary[] => {
    const categories = Array.from(new Set(testCases.map(tc => tc.category)));
    const severities: ('critical' | 'high' | 'medium' | 'low')[] = ['critical', 'high', 'medium', 'low'];

    return models.map(model => {
      const runs = evaluationRuns.filter(r => r.model_id === model.id);
      const detectedCount = runs.filter(r => r.detected_vulnerability).length;
      const cweCount = runs.filter(r => r.correct_cwe).length;
      const lineCount = runs.filter(r => r.correct_lines).length;
      const patchCount = runs.filter(r => r.patch_secure).length;
      const totalScoreSum = runs.reduce((acc, r) => acc + r.total_score, 0);
      const totalLatency = runs.reduce((acc, r) => acc + r.latency_ms, 0);

      const category_scores = categories.map(cat => {
        const catRuns = runs.filter(r => {
          const tc = testCases.find(t => t.id === r.test_case_id);
          return tc?.category === cat;
        });
        const catTotal = catRuns.length || 1;
        const catScore = catRuns.reduce((sum, r) => sum + r.total_score, 0) / catTotal;
        const catDetected = (catRuns.filter(r => r.detected_vulnerability).length / catTotal) * 100;

        return {
          category: cat,
          score: Math.round(catScore),
          detection_rate: Math.round(catDetected)
        };
      });

      const severity_scores = severities.map(sev => {
        const sevRuns = runs.filter(r => {
          const tc = testCases.find(t => t.id === r.test_case_id);
          return tc?.severity === sev;
        });
        const sevTotal = sevRuns.length || 1;
        const sevScore = sevRuns.reduce((sum, r) => sum + r.total_score, 0) / sevTotal;

        return {
          severity: sev,
          score: Math.round(sevScore),
          total: sevRuns.length
        };
      });

      return {
        model_id: model.id,
        model_name: model.name,
        provider: model.provider,
        version: model.version,
        total_cases: runs.length,
        overall_score: runs.length > 0 ? Math.round(totalScoreSum / runs.length) : 0,
        detection_rate: runs.length > 0 ? Math.round((detectedCount / runs.length) * 100) : 0,
        cwe_accuracy: runs.length > 0 ? Math.round((cweCount / runs.length) * 100) : 0,
        localization_accuracy: runs.length > 0 ? Math.round((lineCount / runs.length) * 100) : 0,
        patch_success_rate: runs.length > 0 ? Math.round((patchCount / runs.length) * 100) : 0,
        avg_latency_ms: runs.length > 0 ? Math.round(totalLatency / runs.length) : 0,
        category_scores,
        severity_scores
      };
    }).sort((a, b) => b.overall_score - a.overall_score);
  }
};
