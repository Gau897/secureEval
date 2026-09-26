import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const severity = searchParams.get('severity') || undefined;
    const language = searchParams.get('language') || undefined;
    const search = searchParams.get('search') || undefined;

    const testCases = db.getTestCases({ category, severity, language, search });
    return NextResponse.json({ success: true, count: testCases.length, data: testCases });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.title || !body.vulnerable_code || !body.cwe_id) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, vulnerable_code, cwe_id' },
        { status: 400 }
      );
    }

    const newTestCase = {
      ...body,
      id: `tc-${Date.now()}`,
      created_at: new Date().toISOString()
    };

    db.addTestCase(newTestCase);
    return NextResponse.json({ success: true, data: newTestCase }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
