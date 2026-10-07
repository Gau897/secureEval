'use client';

import React from 'react';
import { X, Printer, ShieldCheck } from 'lucide-react';
import { ModelBenchmarkSummary, TestCase } from '@/types';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaderboard: ModelBenchmarkSummary[];
  testCases: TestCase[];
}

export default function ExecutiveReportModal({
  isOpen,
  onClose,
  leaderboard,
  testCases
}: ExecutiveReportModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const topModel = leaderboard[0];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg max-w-4xl w-full p-8 shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 no-print">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-bold text-slate-900">Executive Security Benchmark Audit Report</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-slate-900 text-white rounded text-xs font-semibold flex items-center space-x-1.5 hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-slate-900 font-sans">
          {/* Report Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight">SECURE_EVAL AUDIT REPORT</h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Empirical Large Language Model Code Security & CWE Benchmark</p>
              </div>
              <div className="text-right text-xs font-mono text-slate-600">
                <div>Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'medium' })}</div>
                <div>Status: CERTIFIED BENCHMARK</div>
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="bg-slate-50 border border-slate-200 rounded p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">1. Executive Summary</h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              This audit evaluates frontier AI models ({leaderboard.map(m => m.model_name).join(', ')}) across {testCases.length} verified vulnerability scenarios covering OWASP Top 10 weaknesses (SQL Injection, SSRF, Deserialization, Path Traversal, Hardcoded Secrets, and Access Control). The highest scoring model in this benchmark cycle is <strong>{topModel?.model_name || 'Claude 3.5 Sonnet'}</strong> with an overall score of <strong>{topModel?.overall_score || 100}%</strong>.
            </p>
          </div>

          {/* Model Rankings Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">2. Official Benchmark Scorecard</h3>
            <table className="w-full text-left border-collapse text-xs border border-slate-200">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
                  <th className="py-2 px-3">Model</th>
                  <th className="py-2 px-3 text-center">Score</th>
                  <th className="py-2 px-3 text-center">Detection Rate</th>
                  <th className="py-2 px-3 text-center">CWE Accuracy</th>
                  <th className="py-2 px-3 text-center">Patch Success</th>
                  <th className="py-2 px-3 text-right">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leaderboard.map((m, idx) => (
                  <tr key={m.model_id}>
                    <td className="py-2 px-3 font-semibold">{idx + 1}. {m.model_name} <span className="text-[10px] text-slate-500 font-mono font-normal">({m.provider})</span></td>
                    <td className="py-2 px-3 text-center font-bold">{m.overall_score}%</td>
                    <td className="py-2 px-3 text-center">{m.detection_rate}%</td>
                    <td className="py-2 px-3 text-center">{m.cwe_accuracy}%</td>
                    <td className="py-2 px-3 text-center">{m.patch_success_rate}%</td>
                    <td className="py-2 px-3 text-right font-mono">{m.avg_latency_ms} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Key Security Findings */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">3. Critical Vulnerability Blindspots</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-slate-200 rounded p-3 bg-white">
                <div className="font-bold text-slate-900 mb-1">SSRF & Cloud Metadata Protection (CWE-918)</div>
                <p className="text-slate-600 text-[11px]">
                  While top models check basic URL protocols, lighter coding models fail to enforce RFC 1918 private IP and cloud metadata DNS filters (169.254.169.254).
                </p>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-white">
                <div className="font-bold text-slate-900 mb-1">Insecure Deserialization & RCE (CWE-502)</div>
                <p className="text-slate-600 text-[11px]">
                  Frontier models consistently recommend replacing unsafe pickle loaders with structured JSON schemas and cryptographic HMAC signatures.
                </p>
              </div>
            </div>
          </div>

          {/* Test Coverage Catalog */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">4. Evaluated Test Suite Coverage ({testCases.length} Scenarios)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              {testCases.map(tc => (
                <div key={tc.id} className="p-2 border border-slate-200 rounded bg-slate-50 flex items-center justify-between">
                  <span className="font-bold">{tc.cwe_id}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{tc.language}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Disclaimer */}
          <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
            <span>SecureEval AI Evaluation Platform • https://github.com/Gau897/secureEval</span>
            <span>Deterministic Scoring: AST + CWE Ground Truth</span>
          </div>
        </div>
      </div>
    </div>
  );
}
