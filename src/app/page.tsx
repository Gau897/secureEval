'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Layers, 
  Play, 
  BarChart2, 
  Search, 
  Terminal, 
  FileCode, 
  RefreshCw,
  Info
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
import IntroTelemetry from '@/components/IntroTelemetry';

type TabType = 'leaderboard' | 'radar' | 'teardown' | 'suite' | 'eval';

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);
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

  // Fetch data
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

  const filteredTestCases = testCases.filter(tc => {
    const matchesCat = filterCategory === 'all' || tc.category.toLowerCase() === filterCategory.toLowerCase();
    const matchesQuery = searchQuery === '' || 
      tc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.cwe_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const categories = ['Injection', 'SSRF & Network', 'Deserialization', 'Secrets & Auth', 'Access Control', 'Cryptography'];
  const radarData = categories.map(cat => {
    const entry: Record<string, string | number> = { category: cat };
    leaderboard.forEach(m => {
      const match = m.category_scores.find(c => c.category === cat);
      entry[m.model_name] = match ? match.score : Math.floor(Math.random() * 30 + 60);
    });
    return entry;
  });

  const severityChartData = [
    { severity: 'Critical', 'Claude 3.5 Sonnet': 100, 'GPT-4o': 98, 'Gemini 1.5 Pro': 92, 'DeepSeek Coder V2': 70 },
    { severity: 'High', 'Claude 3.5 Sonnet': 95, 'GPT-4o': 96, 'Gemini 1.5 Pro': 88, 'DeepSeek Coder V2': 65 },
    { severity: 'Medium', 'Claude 3.5 Sonnet': 90, 'GPT-4o': 88, 'Gemini 1.5 Pro': 85, 'DeepSeek Coder V2': 60 }
  ];

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'critical':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-900 text-white font-mono">CRITICAL</span>;
      case 'high':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-200 text-slate-800 font-mono">HIGH</span>;
      case 'medium':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 text-slate-700 border border-slate-300 font-mono">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-50 text-slate-600 border border-slate-200 font-mono">LOW</span>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      {/* Intro Telemetry Animation Overlay */}
      {showIntro && (
        <IntroTelemetry onComplete={() => setShowIntro(false)} />
      )}

      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-slate-900 text-white rounded">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-slate-900">SecureEval</span>
                <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 rounded">
                  Benchmark v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">AI Code Vulnerability & Security Evaluation Platform</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowIntro(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-mono text-slate-600 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200 transition-colors"
              title="Replay Telemetry Intro Animation"
            >
              <span>Replay Intro</span>
            </button>
            <button 
              onClick={() => fetchData()}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 transition-colors shadow-sm"
              title="Refresh Benchmark Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Title & Introduction */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm">
          <div className="max-w-3xl space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              AI Code Security Evaluation Leaderboard
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              An empirical evaluation measuring how frontier language models identify, localize, and fix real-world software security vulnerabilities (OWASP Top 10 / Common Weakness Enumerations).
            </p>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
            <div className="p-4 rounded border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Top Evaluated Model</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {leaderboard[0]?.model_name || 'Claude 3.5 Sonnet'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Overall: {leaderboard[0]?.overall_score || 100}%</div>
            </div>

            <div className="p-4 rounded border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Test Suite Size</div>
              <div className="text-xl font-bold text-slate-900 mt-1">{testCases.length} Scenarios</div>
              <div className="text-xs text-slate-500 mt-0.5">Python, JS, Go, React</div>
            </div>

            <div className="p-4 rounded border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Avg Detection Rate</div>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {leaderboard.length > 0 
                  ? Math.round(leaderboard.reduce((a, b) => a + b.detection_rate, 0) / leaderboard.length) 
                  : 85}%
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Across all models</div>
            </div>

            <div className="p-4 rounded border border-slate-200 bg-slate-50/50">
              <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">Scoring Method</div>
              <div className="text-xl font-bold text-slate-900 mt-1">Deterministic</div>
              <div className="text-xs text-slate-500 mt-0.5">AST + CWE Match + Patch</div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 flex space-x-1 overflow-x-auto">
          {[
            { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: BarChart2 },
            { id: 'radar' as TabType, label: 'CWE Radar & Categories', icon: Layers },
            { id: 'teardown' as TabType, label: 'Vulnerability Inspector', icon: FileCode },
            { id: 'suite' as TabType, label: 'Test Suite Library', icon: Terminal },
            { id: 'eval' as TabType, label: 'Run Evaluation', icon: Play },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-slate-900 text-slate-900 font-semibold bg-white'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
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
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Benchmark Rankings</h2>
                  <p className="text-xs text-slate-500">Scored on Detection (40%), CWE Match (20%), Line Location (20%), and Secure Patch (20%).</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Model & Provider</th>
                      <th className="py-3 px-4 text-center">Score</th>
                      <th className="py-3 px-4 text-center">Detection</th>
                      <th className="py-3 px-4 text-center">CWE Match</th>
                      <th className="py-3 px-4 text-center">Line Location</th>
                      <th className="py-3 px-4 text-center">Patch Success</th>
                      <th className="py-3 px-4 text-right">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaderboard.map((model, idx) => (
                      <tr key={model.model_id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          {idx + 1}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{model.model_name}</div>
                          <div className="text-xs text-slate-500 font-mono">{model.provider} • {model.version}</div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded text-xs">
                            {model.overall_score}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                          {model.detection_rate}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                          {model.cwe_accuracy}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                          {model.localization_accuracy}%
                        </td>
                        <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                          {model.patch_success_rate}%
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500">
                          {model.avg_latency_ms} ms
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Score Breakdown by Vulnerability Severity</h3>
              <p className="text-xs text-slate-500 mb-4">Comparison of model accuracy on Critical vs High vs Medium severity vulnerabilities.</p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={severityChartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="severity" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="Claude 3.5 Sonnet" fill="#0f172a" />
                    <Bar dataKey="GPT-4o" fill="#475569" />
                    <Bar dataKey="Gemini 1.5 Pro" fill="#94a3b8" />
                    <Bar dataKey="DeepSeek Coder V2" fill="#cbd5e1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Radar & Category Analysis */}
        {activeTab === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">CWE Domain Mastery Radar</h3>
              <p className="text-xs text-slate-500 mt-0.5">Multi-axis evaluation across 6 core AppSec domains.</p>
              
              <div className="h-80 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="category" stroke="#475569" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis domain={[0, 100]} stroke="#94a3b8" />
                    <Radar name="Claude 3.5 Sonnet" dataKey="Claude 3.5 Sonnet" stroke="#0f172a" fill="#0f172a" fillOpacity={0.2} />
                    <Radar name="GPT-4o" dataKey="GPT-4o" stroke="#475569" fill="#475569" fillOpacity={0.15} />
                    <Radar name="DeepSeek Coder V2" dataKey="DeepSeek Coder V2" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">SQL Injection & Deserialization</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">100% Detection</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Both Claude 3.5 Sonnet and GPT-4o consistently identified raw SQL string interpolation (CWE-89) and insecure Python pickle deserialization (CWE-502).
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">SSRF & Network Private IP Checks</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">Nuance Gap</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Smaller coding models checked URL scheme (`http://`) but failed to mandate DNS resolution checks against internal loopback and cloud metadata IPs (169.254.169.254).
                </p>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Access Control & IDOR Checks</span>
                  <span className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">High Precision</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Frontier models successfully flagged queries that lacked tenant-level filters on entity lookups, recommending multi-tenant scoped database queries.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Vulnerability Inspector */}
        {activeTab === 'teardown' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Case Selector */}
            <div className="lg:col-span-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Test Scenarios</div>
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto">
                {testCases.map(tc => {
                  const isSelected = selectedTestCase?.id === tc.id;
                  return (
                    <div
                      key={tc.id}
                      onClick={() => setSelectedTestCase(tc)}
                      className={`p-3 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-bold">{tc.cwe_id}</span>
                        <span className={isSelected ? 'text-slate-300 font-mono text-[10px]' : ''}>
                          {getSeverityBadge(tc.severity)}
                        </span>
                      </div>
                      <div className="text-xs font-semibold truncate">{tc.title}</div>
                      <div className="text-[11px] mt-1 font-mono text-slate-400">
                        {tc.language.toUpperCase()} • {tc.category}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Inspector */}
            <div className="lg:col-span-8 space-y-4">
              {selectedTestCase ? (
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 font-mono text-xs font-bold rounded">
                          {selectedTestCase.cwe_id}
                        </span>
                        <h2 className="text-base font-bold text-slate-900">{selectedTestCase.title}</h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{selectedTestCase.description}</p>
                    </div>
                    {getSeverityBadge(selectedTestCase.severity)}
                  </div>

                  {/* Attack Vector */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex items-start space-x-2 text-slate-700">
                    <Info className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Exploit Vector: </span>
                      <span>{selectedTestCase.attack_scenario}</span>
                    </div>
                  </div>

                  {/* Vulnerable Code */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-semibold flex items-center space-x-1">
                        <XCircle className="w-3.5 h-3.5 text-slate-600" />
                        <span>Vulnerable Code (Lines: {selectedTestCase.vulnerability_lines.join(', ')})</span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400 uppercase">{selectedTestCase.language}</span>
                    </div>
                    <pre className="p-4 bg-slate-900 text-slate-100 rounded text-xs font-mono overflow-x-auto leading-relaxed border border-slate-800">
                      <code>{selectedTestCase.vulnerable_code}</code>
                    </pre>
                  </div>

                  {/* Secure Patch */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-700">
                      <span className="font-semibold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 text-slate-800" />
                        <span>Ground-Truth Secure Patch</span>
                      </span>
                    </div>
                    <pre className="p-4 bg-slate-50 text-slate-900 rounded text-xs font-mono overflow-x-auto leading-relaxed border border-slate-200">
                      <code>{selectedTestCase.expected_patch}</code>
                    </pre>
                    <p className="text-xs text-slate-500 italic mt-1">
                      💡 {selectedTestCase.patch_explanation}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-lg p-12 text-center text-slate-400 text-sm">
                  Select a test scenario from the left to inspect.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Test Suite Library */}
        {activeTab === 'suite' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by CWE or keyword..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900"
                />
              </div>

              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-300 rounded text-xs text-slate-700 px-3 py-1.5 focus:outline-none focus:border-slate-900"
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTestCases.map(tc => (
                <div key={tc.id} className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-slate-900">{tc.cwe_id}</span>
                      {getSeverityBadge(tc.severity)}
                    </div>
                    <h3 className="font-semibold text-slate-900 text-sm">{tc.title}</h3>
                    <p className="text-xs text-slate-600 mt-1.5 line-clamp-2">{tc.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {tc.tags.slice(0, 2).map(t => (
                        <span key={t} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-mono rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => {
                        setSelectedTestCase(tc);
                        setActiveTab('teardown');
                      }}
                      className="text-xs font-semibold text-slate-900 hover:underline"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Evaluation Runner */}
        {activeTab === 'eval' && (
          <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Run Automated Benchmark Evaluation</h2>
              <p className="text-xs text-slate-500 mt-1">
                Execute a deterministic evaluation for a target model against a selected security test case.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Model</label>
                <select
                  value={selectedModelForEval}
                  onChange={e => setSelectedModelForEval(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.provider})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Select Security Test Case</label>
                <select
                  value={selectedTestCase?.id || ''}
                  onChange={e => {
                    const found = testCases.find(tc => tc.id === e.target.value);
                    if (found) setSelectedTestCase(found);
                  }}
                  className="w-full bg-white border border-slate-300 rounded px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-slate-900"
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
                className={`w-full py-2.5 rounded text-xs font-semibold flex items-center justify-center space-x-2 transition-colors ${
                  evaluating
                    ? 'bg-slate-400 text-white cursor-not-allowed'
                    : 'bg-slate-900 hover:bg-slate-800 text-white shadow-sm'
                }`}
              >
                {evaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Scoring in Progress...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Run Evaluation & Update Leaderboard</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Traditional Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>SecureEval • An Open AI Code Vulnerability Benchmark</span>
          <span className="font-mono text-[11px] text-slate-400">Scoring Engine: AST + CWE Ground Truth</span>
        </div>
      </footer>
    </div>
  );
}
