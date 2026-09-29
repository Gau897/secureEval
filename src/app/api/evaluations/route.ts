import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auditCodeWithModel } from '@/lib/ai-connector';
import { scoreModelAudit } from '@/lib/scoring-engine';

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
    const { model_id, test_case_id, apiKey } = body;

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

    // 1. Run AI Model Audit
    const auditResponse = await auditCodeWithModel(
      {
        model_id,
        code_snippet: testCase.vulnerable_code,
        language: testCase.language
      },
      apiKey
    );

    // 2. Score using Deterministic Ground-Truth Engine
    const evaluationRun = scoreModelAudit(testCase, auditResponse, model_id);

    // 3. Save to database
    db.addEvaluationRun(evaluationRun);

    return NextResponse.json({ success: true, data: evaluationRun });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
