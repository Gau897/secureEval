import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const leaderboard = db.getBenchmarkSummaries();
    const testCases = db.getTestCases();
    const models = db.getModels();
    const runs = db.getEvaluationRuns();

    return NextResponse.json({
      success: true,
      stats: {
        total_test_cases: testCases.length,
        total_models: models.length,
        total_evaluations: runs.length,
        top_model: leaderboard[0]?.model_name || 'N/A',
        highest_score: leaderboard[0]?.overall_score || 0
      },
      leaderboard
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
