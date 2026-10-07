'use client';

import React, { useState } from 'react';
import { Swords, RefreshCw, CheckCircle, XCircle, Trophy, Zap } from 'lucide-react';
import { TestCase, ModelSnapshot } from '@/types';
import { ModelAuditResponse } from '@/lib/ai-connector';

interface BattleArenaProps {
  testCases: TestCase[];
  models: ModelSnapshot[];
  apiKey?: string;
}

export default function BattleArena({ testCases, models, apiKey }: BattleArenaProps) {
  const [modelA, setModelA] = useState<string>('claude-3-5-sonnet');
  const [modelB, setModelB] = useState<string>('gpt-4o');
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(testCases[0]?.id || '');
  const [battling, setBattling] = useState<boolean>(false);
  const [resultA, setResultA] = useState<{ audit: ModelAuditResponse; score: number } | null>(null);
  const [resultB, setResultB] = useState<{ audit: ModelAuditResponse; score: number } | null>(null);

  const selectedCase = testCases.find(tc => tc.id === selectedTestCaseId) || testCases[0];

  const handleStartBattle = async () => {
    if (!selectedCase) return;
    try {
      setBattling(true);
      setResultA(null);
      setResultB(null);

      // Run both models in parallel
      const [resA, resB] = await Promise.all([
        fetch('/api/evaluations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test_case_id: selectedCase.id, model_id: modelA, apiKey: apiKey || undefined })
        }),
        fetch('/api/evaluations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test_case_id: selectedCase.id, model_id: modelB, apiKey: apiKey || undefined })
        })
      ]);

      const dataA = await resA.json();
      const dataB = await resB.json();

      if (dataA.success) {
        setResultA({
          audit: {
            raw_response: dataA.data.raw_response,
            detected_vulnerability: dataA.data.detected_vulnerability,
            identified_cwe: dataA.data.identified_cwe,
            identified_lines: dataA.data.identified_lines || [],
            explanation: dataA.data.detected_vulnerability 
              ? `Correctly identified flaw with CWE precision and patch.` 
              : `Missed critical vulnerability in this test scenario.`,
            suggested_patch: dataA.data.patch_code,
            latency_ms: dataA.data.latency_ms
          },
          score: dataA.data.total_score
        });
      }

      if (dataB.success) {
        setResultB({
          audit: {
            raw_response: dataB.data.raw_response,
            detected_vulnerability: dataB.data.detected_vulnerability,
            identified_cwe: dataB.data.identified_cwe,
            identified_lines: dataB.data.identified_lines || [],
            explanation: dataB.data.detected_vulnerability 
              ? `Identified vulnerability with relevant line localization.` 
              : `Missed the security flaw in this scenario.`,
            suggested_patch: dataB.data.patch_code,
            latency_ms: dataB.data.latency_ms
          },
          score: dataB.data.total_score
        });
      }
    } catch (err) {
      console.error('Battle error:', err);
    } finally {
      setBattling(false);
    }
  };

  const modelAName = models.find(m => m.id === modelA)?.name || modelA;
  const modelBName = models.find(m => m.id === modelB)?.name || modelB;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-slate-900 text-white rounded">
            <Swords className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Model vs Model Side-by-Side Arena</h2>
            <p className="text-xs text-slate-500">Compare two AI models simultaneously on the exact same vulnerability scenario.</p>
          </div>
        </div>

        {/* Selection Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-4 border-t border-slate-100">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Model A</label>
            <select
              value={modelA}
              onChange={e => setModelA(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Model B</label>
            <select
              value={modelB}
              onChange={e => setModelB(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {models.map(m => (
                <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Test Vulnerability Scenario</label>
            <select
              value={selectedTestCaseId}
              onChange={e => setSelectedTestCaseId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
            >
              {testCases.map(tc => (
                <option key={tc.id} value={tc.id}>[{tc.cwe_id}] {tc.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Battle Trigger Button */}
        <div className="mt-4 flex justify-end">
          <button
            disabled={battling}
            onClick={handleStartBattle}
            className={`px-5 py-2.5 rounded text-xs font-semibold flex items-center space-x-2 transition-colors ${
              battling
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
            }`}
          >
            {battling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Side-by-Side Audit...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Execute Head-to-Head Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Battle Results Columns */}
      {(resultA || resultB) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model A Result */}
          <div className={`bg-white border rounded-lg p-6 shadow-sm space-y-4 ${
            resultA && resultB && resultA.score > resultB.score 
              ? 'border-slate-900 ring-1 ring-slate-900' 
              : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">{modelAName}</span>
                {resultA && resultB && resultA.score > resultB.score && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                    <Trophy className="w-3 h-3 text-amber-300" />
                    <span>WINNER</span>
                  </span>
                )}
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                Score: {resultA?.score}/100
              </div>
            </div>

            {resultA && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vulnerability Status:</span>
                  <span className={`font-semibold flex items-center space-x-1 ${
                    resultA.audit.detected_vulnerability ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {resultA.audit.detected_vulnerability ? (
                      <><CheckCircle className="w-3.5 h-3.5" /><span>DETECTED</span></>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /><span>MISSED</span></>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CWE Classification:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {resultA.audit.identified_cwe || 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Execution Latency:</span>
                  <span className="font-mono text-slate-600">{resultA.audit.latency_ms} ms</span>
                </div>

                {resultA.audit.suggested_patch && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-700 block mb-1">Generated Patch:</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48">
                      <code>{resultA.audit.suggested_patch}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Model B Result */}
          <div className={`bg-white border rounded-lg p-6 shadow-sm space-y-4 ${
            resultA && resultB && resultB.score > resultA.score 
              ? 'border-slate-900 ring-1 ring-slate-900' 
              : 'border-slate-200'
          }`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-bold text-slate-900">{modelBName}</span>
                {resultA && resultB && resultB.score > resultA.score && (
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono font-bold rounded">
                    <Trophy className="w-3 h-3 text-amber-300" />
                    <span>WINNER</span>
                  </span>
                )}
              </div>
              <div className="text-sm font-bold font-mono text-slate-900">
                Score: {resultB?.score}/100
              </div>
            </div>

            {resultB && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Vulnerability Status:</span>
                  <span className={`font-semibold flex items-center space-x-1 ${
                    resultB.audit.detected_vulnerability ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {resultB.audit.detected_vulnerability ? (
                      <><CheckCircle className="w-3.5 h-3.5" /><span>DETECTED</span></>
                    ) : (
                      <><XCircle className="w-3.5 h-3.5" /><span>MISSED</span></>
                    )}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CWE Classification:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {resultB.audit.identified_cwe || 'None'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Execution Latency:</span>
                  <span className="font-mono text-slate-600">{resultB.audit.latency_ms} ms</span>
                </div>

                {resultB.audit.suggested_patch && (
                  <div className="pt-2">
                    <span className="font-semibold text-slate-700 block mb-1">Generated Patch:</span>
                    <pre className="p-3 bg-slate-900 text-slate-100 rounded text-[11px] font-mono overflow-x-auto leading-relaxed max-h-48">
                      <code>{resultB.audit.suggested_patch}</code>
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
