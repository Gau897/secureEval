import { NextRequest, NextResponse } from 'next/server';
import { auditCodeWithModel } from '@/lib/ai-connector';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, language = 'python', model_id = 'claude-3-5-sonnet', apiKey } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Source code snippet is required' },
        { status: 400 }
      );
    }

    // Run AI Security Audit
    const result = await auditCodeWithModel(
      {
        model_id,
        code_snippet: code,
        language
      },
      apiKey
    );

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: (error as Error).message },
      { status: 500 }
    );
  }
}
