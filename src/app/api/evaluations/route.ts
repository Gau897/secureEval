import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { EvaluationRun } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const model_id = searchParams.get('model_id') || undefined;
    const test_case_id = searchParams.get('test_case_id') || undefined;

    const runs = db.getEvaluationRuns({ model_id, test_case_id });
    return NextResponse.json({ success: true, count: runs.length, data: runs });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model_id, test_case_id } = body;

    if (!model_id || !test_case_id) {
      return NextResponse.json(
        { success: false, error: 'model_id and test_case_id are required' },
        { status: 400 }
      );
    }

    const testCase = db.getTestCaseById(test_case_id);
    const model = db.getModelById(model_id);

    if (!testCase || !model) {
      return NextResponse.json(
        { success: false, error: 'Test case or Model not found' },
        { status: 404 }
      );
    }

    // Evaluation scoring simulation engine
    const detected = Math.random() > 0.15;
    const correctCwe = detected && Math.random() > 0.2;
    const correctLines = detected && Math.random() > 0.25;
    const patchSecure = detected && Math.random() > 0.3;

    const score_detection = detected ? 40 : 0;
    const score_cwe = correctCwe ? 20 : 0;
    const score_localization = correctLines ? 20 : 0;
    const score_patch = patchSecure ? 20 : 0;
    const total_score = score_detection + score_cwe + score_localization + score_patch;

    const newRun: EvaluationRun = {
      id: `eval-${Date.now()}`,
      test_case_id,
      model_id,
      prompt_used: `Audit the code snippet for ${testCase.cwe_name} and identify root cause lines.`,
      raw_response: detected
        ? `Identified vulnerability: ${testCase.cwe_name} (${testCase.cwe_id}) on lines ${testCase.vulnerability_lines.join(', ')}.\nSuggested patch:\n${testCase.expected_patch}`
        : `No critical security flaws were detected in the provided code snippet.`,
      detected_vulnerability: detected,
      identified_cwe: detected ? testCase.cwe_id : undefined,
      correct_cwe: correctCwe,
      identified_lines: detected ? testCase.vulnerability_lines : [],
      correct_lines: correctLines,
      patch_provided: detected,
      patch_secure: patchSecure,
      patch_code: patchSecure ? testCase.expected_patch : undefined,
      score_detection,
      score_cwe,
      score_localization,
      score_patch,
      total_score,
      latency_ms: Math.floor(Math.random() * 800) + 700,
      timestamp: new Date().toISOString()
    };

    db.addEvaluationRun(newRun);

    return NextResponse.json({ success: true, data: newRun });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
