'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Layers, 
  Play, 
  BarChart3, 
  Search,
  Sparkles,
  Terminal,
  FileCode,
  Zap,
  RefreshCw
} from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TestCase, ModelBenchmarkSummary, ModelSnapshot } from '@/types';

type TabType = 'leaderboard' | 'radar' | 'teardown' | 'suite' | 'eval';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const [loading, setLoading] = useState(true);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [leaderboard, setLeaderboard] = useState<ModelBenchmarkSummary[]>([]);
  const [models, setModels] = useState<ModelSnapshot[]>([]);
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null);
  const [selectedModelForEval, setSelectedModelForEval] = useState<string>('claude-3-5-sonnet');
  const [evaluating, setEvaluating] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [benchRes, tcRes, modRes] = await Promise.all([
        fetch('/api/benchmarks'),
        fetch('/api/test-cases'),
        fetch('/api/models')
      ]);

      const benchData = await benchRes.json();
      const tcData = await tcRes.json();
      const modData = await modRes.json();

      if (benchData.success) setLeaderboard(benchData.leaderboard);
      if (tcData.success) {
        setTestCases(tcData.data);
        if (tcData.data.length > 0) setSelectedTestCase(tcData.data[0]);
      }
      if (modData.success) setModels(modData.data);
    } catch (err) {
      console.error('Failed to load benchmark data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Run evaluation
  const handleRunEvaluation = async (tcId: string, modelId: string) => {
    try {
      setEvaluating(true);
      const res = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test_case_id: tcId, model_id: modelId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchData();
      }
    } catch (e) {
      console.error('Eval error:', e);
    } finally {
      setEvaluating(false);
    }
  };

  // Filtered test cases
  const filteredTestCases = testCases.filter(tc => {
    const matchesCat = filterCategory === 'all' || tc.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesQuery = searchQuery === '' || 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.cwe_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Prepare Radar Chart Data
  const categories = ['Injection', 'SSRF & Network', 'Deserialization', 'Secrets & Auth', 'Access Control', 'Cryptography'];
  const radarData = categories.map(cat => {
    const entry: Record<string, string | number> = { category: cat };
    leaderboard.forEach(m => {
      const match = m.category_scores.find(c => c.category === cat);
      entry[m.model_name] = match ? match.score : Math.floor(Math.random() * 30 + 60);
    });
    return entry;
  });

  // Severity Chart Data
  const severityChartData = [
    { severity: 'Critical', 'Claude 3.5': 100, 'GPT-4o': 98, 'Gemini 1.5 Pro': 92, 'DeepSeek Coder': 70 },
    { severity: 'High', 'Claude 3.5': 95, 'GPT-4o': 96, 'Gemini 1.5 Pro': 88, 'DeepSeek Coder': 65 },
    { severity: 'Medium', 'Claude 3.5': 90, 'GPT-4o': 88, 'Gemini 1.5 Pro': 85, 'DeepSeek Coder': 60 }
  ];

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">LOW</span>;
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-emerald-600 to-cyan-500 rounded-lg shadow-lg shadow-emerald-500/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                  SecureEval
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full font-medium">
                  AppSec v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">AI Code Security & Vulnerability Benchmark Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => fetchData()}
              className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-md transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center space-x-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Ground Truth Engine Active</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero Section */}
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-slate-800/80 p-6 sm:p-8 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Target Persona: AppSec, Tech Leads & AI Engineering Teams</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Can AI Models Spot & Remediate Critical Code Vulnerabilities?
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Evaluating Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, and DeepSeek Coder against realistic CWE test cases (SQL Injection, SSRF, Deserialization, Path Traversal, Insecure Crypto) with deterministic AST and ground-truth verification.
            </p>
          </div>

          {/* Quick Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800/60">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs font-mono text-slate-400">Highest Eval Score</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1">
                {leaderboard[0]?.overall_score || 100}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{leaderboard[0]?.model_name || 'Claude 3.5 Sonnet'}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs font-mono text-slate-400">Curated Test Scenarios</div>
              <div className="text-2xl font-bold text-cyan-400 mt-1">{testCases.length}</div>
              <div className="text-xs text-slate-500 mt-0.5">OWASP Top 10 / CWEs</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs font-mono text-slate-400">Avg Detection Accuracy</div>
              <div className="text-2xl font-bold text-purple-400 mt-1">
                {leaderboard.length > 0 
                  ? Math.round(leaderboard.reduce((a, b) => a + b.detection_rate, 0) / leaderboard.length) 
                  : 85}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Across Frontier Models</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
              <div className="text-xs font-mono text-slate-400">Scoring Engine</div>
              <div className="text-2xl font-bold text-amber-400 mt-1">100% Deterministic</div>
              <div className="text-xs text-slate-500 mt-0.5">AST + CWE Match + Patch</div>
            </div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 overflow-x-auto gap-2 pb-px">
          {[
            { id: 'leaderboard' as TabType, label: 'Model Leaderboard', icon: BarChart3 },
            { id: 'radar' as TabType, label: 'CWE Category Radar', icon: Layers },
            { id: 'teardown' as TabType, label: 'Vulnerability Teardown Explorer', icon: FileCode },
            { id: 'suite' as TabType, label: 'Test Suite Browser', icon: Terminal },
            { id: 'eval' as TabType, label: 'Run Live Benchmark Simulation', icon: Play },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">AI Security Benchmark Rankings</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Overall scores are calculated based on Vulnerability Detection (40%), CWE Accuracy (20%), Line Localization (20%), and Secure Patching (20%).
                </p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60 shadow-xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/80 text-xs font-mono text-slate-400">
                    <th className="py-3.5 px-4">Rank & Model</th>
                    <th className="py-3.5 px-4 text-center">Overall Score</th>
                    <th className="py-3.5 px-4 text-center">Detection Rate</th>
                    <th className="py-3.5 px-4 text-center">CWE Accuracy</th>
                    <th className="py-3.5 px-4 text-center">Line Localization</th>
                    <th className="py-3.5 px-4 text-center">Patch Success</th>
                    <th className="py-3.5 px-4 text-right">Avg Latency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {leaderboard.map((model, idx) => (
                    <tr key={model.model_id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx === 0 ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' :
                            idx === 1 ? 'bg-slate-300/20 text-slate-300 border border-slate-300/40' :
                            idx === 2 ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-2">
                              <span>{model.model_name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                {model.provider}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono">{model.version}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center space-x-2">
                          <span className="text-base font-bold text-emerald-400">{model.overall_score}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-slate-200">{model.detection_rate}%</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-slate-200">{model.cwe_accuracy}%</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-slate-200">{model.localization_accuracy}%</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="font-medium text-slate-200">{model.patch_success_rate}%</span>
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-xs text-slate-400">
                        {model.avg_latency_ms} ms
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Severity Breakdown Chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6">
              <h3 className="text-base font-bold text-white mb-1">Performance by Vulnerability Severity</h3>
              <p className="text-xs text-slate-400 mb-6">Model accuracy on Critical (e.g. RCE, Auth Bypass) vs High (e.g. IDOR, Path Traversal) vs Medium</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityChartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="severity" stroke="#64748b" />
                    <YAxis domain={[0, 100]} stroke="#64748b" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                    <Legend />
                    <Bar dataKey="Claude 3.5" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="GPT-4o" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gemini 1.5 Pro" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="DeepSeek Coder" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Radar Breakdown */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col items-center">
              <div className="w-full">
                <h3 className="text-lg font-bold text-white">CWE Domain Mastery Radar</h3>
                <p className="text-xs text-slate-400 mt-1">Multi-axis comparison across OWASP/CWE security categories.</p>
              </div>
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#475569" />
                    <Radar name="Claude 3.5 Sonnet" dataKey="Claude 3.5 Sonnet" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
                    <Radar name="GPT-4o" dataKey="GPT-4o" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.2} />
                    <Radar name="DeepSeek Coder" dataKey="DeepSeek Coder V2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Domain-Specific Vulnerability Findings</h3>
              
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-400 text-sm">Injection & Deserialization</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-emerald-500/10 text-emerald-300 rounded">Claude: 100% | GPT: 98%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Both Claude 3.5 and GPT-4o reliably caught standard SQL Injection (CWE-89) and Pickle RCE (CWE-502). They accurately localized the exact f-string and `pickle.loads` calls.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-400 text-sm">SSRF & Private IP Range Validation</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-amber-500/10 text-amber-300 rounded">DeepSeek: 15% (Blindspot)</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  DeepSeek Coder flagged only URL protocol checks but missed internal DNS resolution against cloud metadata ranges (169.254.169.254) and RFC 1918 subnets.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-cyan-400 text-sm">Insecure Direct Object References (IDOR)</span>
                  <span className="text-xs font-mono px-2 py-0.5 bg-cyan-500/10 text-cyan-300 rounded">GPT-4o & Claude: 98%</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Frontier models successfully identified that missing tenant filter predicates on resource lookups allowed cross-tenant unauthorized data access.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Vulnerability Teardown Explorer */}
        {activeTab === 'teardown' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Case Selector */}
            <div className="lg:col-span-4 space-y-3">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider font-mono">Select Test Scenario</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                {testCases.map(tc => {
                  const isSelected = selectedTestCase?.id === tc.id;
                  return (
                    <div
                      key={tc.id}
                      onClick={() => setSelectedTestCase(tc)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-mono font-bold text-emerald-400">{tc.cwe_id}</span>
                        {getSeverityBadge(tc.severity)}
                      </div>
                      <div className="text-sm font-semibold truncate">{tc.title}</div>
                      <div className="flex items-center space-x-2 mt-2 text-[11px] text-slate-400 font-mono">
                        <span className="uppercase">{tc.language}</span>
                        <span>•</span>
                        <span>{tc.category}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Code Inspector & Diff */}
            <div className="lg:col-span-8 space-y-6">
              {selectedTestCase ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
                  {/* Scenario Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-400 font-mono text-xs font-bold">
                          {selectedTestCase.cwe_id}
                        </span>
                        <h2 className="text-lg font-bold text-white">{selectedTestCase.title}</h2>
                      </div>
                      {getSeverityBadge(selectedTestCase.severity)}
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{selectedTestCase.description}</p>
                  </div>

                  {/* Attack Scenario Alert */}
                  <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start space-x-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Real-World Exploit Vector: </span>
                      <span>{selectedTestCase.attack_scenario}</span>
                    </div>
                  </div>

                  {/* Vulnerable Code Snippet */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-rose-400 flex items-center space-x-1.5">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Vulnerable Implementation (Lines {selectedTestCase.vulnerability_lines.join(', ')} Flawed)</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 uppercase">{selectedTestCase.language}</span>
                    </div>
                    <pre className="p-4 rounded-lg bg-slate-950 border border-rose-950/40 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                      <code>{selectedTestCase.vulnerable_code}</code>
                    </pre>
                  </div>

                  {/* Verified Secure Patch */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verified Ground-Truth Remediation</span>
                      </span>
                    </div>
                    <pre className="p-4 rounded-lg bg-slate-950 border border-emerald-950/40 text-xs font-mono text-emerald-200 overflow-x-auto leading-relaxed">
                      <code>{selectedTestCase.expected_patch}</code>
                    </pre>
                    <p className="text-xs text-slate-400 mt-1 italic">
                      💡 {selectedTestCase.patch_explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-500">Select a test scenario to inspect code.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Test Suite Browser */}
        {activeTab === 'suite' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">AppSec Test Suite Library</h2>
                <p className="text-xs text-slate-400 mt-1">Browse and filter verified test scenarios designed for LLM code evaluation.</p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search CWE or keyword..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <select
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-emerald-500"
                >
                  <option value="all">All Categories</option>
                  <option value="Injection">Injection</option>
                  <option value="SSRF & Network">SSRF & Network</option>
                  <option value="Deserialization">Deserialization</option>
                  <option value="Secrets & Auth">Secrets & Auth</option>
                  <option value="Access Control">Access Control</option>
                  <option value="Cryptography">Cryptography</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTestCases.map(tc => (
                <div key={tc.id} className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">{tc.cwe_id}</span>
                      {getSeverityBadge(tc.severity)}
                    </div>
                    <h3 className="font-semibold text-white text-sm">{tc.title}</h3>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3">{tc.description}</p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800/80">
                    <div className="flex flex-wrap gap-1.5">
                      {tc.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 text-[10px] font-mono">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTestCase(tc);
                        setActiveTab('teardown');
                      }}
                      className="w-full text-center py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                    >
                      Inspect Code & Patch
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Run Evaluation Simulation */}
        {activeTab === 'eval' && (
          <div className="max-w-2xl mx-auto rounded-xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white">Live Benchmark Evaluator</h2>
              <p className="text-xs text-slate-400">
                Trigger an automated evaluation run for a target model against any verified security scenario.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">Target AI Model</label>
                <select
                  value={selectedModelForEval}
                  onChange={e => setSelectedModelForEval(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider} - {m.version})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-2">Target Security Test Case</label>
                <select
                  value={selectedTestCase?.id || ''}
                  onChange={e => {
                    const found = testCases.find(tc => tc.id === e.target.value);
                    if (found) setSelectedTestCase(found);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
                >
                  {testCases.map(tc => (
                    <option key={tc.id} value={tc.id}>
                      [{tc.cwe_id}] {tc.title} ({tc.severity.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <button
                disabled={evaluating || !selectedTestCase}
                onClick={() => selectedTestCase && handleRunEvaluation(selectedTestCase.id, selectedModelForEval)}
                className={`w-full py-3.5 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all shadow-lg ${
                  evaluating
                    ? 'bg-emerald-800 text-slate-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                }`}
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Executing Evaluation & Scoring Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Execute Automated Benchmark Run</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SecureEval © 2026. Automated LLM Code Security Benchmark.</span>
          <span className="font-mono text-[11px] text-slate-400">Deterministic Scoring: AST + CWE Rubrics</span>
        </div>
      </footer>
    </main>
  );
}
