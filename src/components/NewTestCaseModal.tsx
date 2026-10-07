'use client';

import React, { useState } from 'react';
import { X, Plus, CheckCircle } from 'lucide-react';
import { TestCase, Severity, ProgrammingLanguage } from '@/types';

type CategoryType = 'Injection' | 'Authentication' | 'SSRF & Network' | 'Deserialization' | 'Secrets & Auth' | 'Access Control' | 'Cryptography';

interface NewTestCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newCase: TestCase) => void;
}

export default function NewTestCaseModal({ isOpen, onClose, onSuccess }: NewTestCaseModalProps) {
  const [title, setTitle] = useState('');
  const [cweId, setCweId] = useState('CWE-89');
  const [cweName, setCweName] = useState('SQL Injection');
  const [category, setCategory] = useState<CategoryType>('Injection');
  const [severity, setSeverity] = useState<Severity>('critical');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [language, setLanguage] = useState<ProgrammingLanguage>('python');
  const [vulnerableCode, setVulnerableCode] = useState('');
  const [vulnerabilityLines, setVulnerabilityLines] = useState('4, 5');
  const [description, setDescription] = useState('');
  const [attackScenario, setAttackScenario] = useState('');
  const [expectedPatch, setExpectedPatch] = useState('');
  const [patchExplanation, setPatchExplanation] = useState('');
  const [tags, setTags] = useState('sql, injection, owasp');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !vulnerableCode || !cweId) {
      alert('Please fill out all required fields (Title, CWE ID, Vulnerable Code)');
      return;
    }

    try {
      setSubmitting(true);
      const parsedLines = vulnerabilityLines
        .split(',')
        .map(l => parseInt(l.trim(), 10))
        .filter(n => !isNaN(n));

      const parsedTags = tags
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0);

      const payload = {
        title,
        cwe_id: cweId.trim().toUpperCase(),
        cwe_name: cweName.trim(),
        category,
        severity,
        difficulty,
        language,
        vulnerable_code: vulnerableCode,
        vulnerability_lines: parsedLines.length > 0 ? parsedLines : [1],
        description,
        attack_scenario: attackScenario,
        expected_patch: expectedPatch,
        patch_explanation: patchExplanation,
        tags: parsedTags
      };

      const res = await fetch('/api/test-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        onSuccess(data.data);
        onClose();
      } else {
        alert('Failed to submit test case: ' + data.error);
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('Failed to submit test case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg max-w-2xl w-full p-6 shadow-xl space-y-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5 text-slate-900" />
            <h2 className="text-base font-bold text-slate-900">Submit New Vulnerability Test Scenario</h2>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Scenario Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. FastAPI Unvalidated Redirect SSRF"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">CWE ID *</label>
              <input
                type="text"
                required
                placeholder="e.g. CWE-89, CWE-918"
                value={cweId}
                onChange={e => setCweId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">CWE Weakness Name</label>
              <input
                type="text"
                placeholder="e.g. Server-Side Request Forgery"
                value={cweName}
                onChange={e => setCweName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as CategoryType)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="Injection">Injection</option>
                <option value="SSRF & Network">SSRF & Network</option>
                <option value="Deserialization">Deserialization</option>
                <option value="Secrets & Auth">Secrets & Auth</option>
                <option value="Access Control">Access Control</option>
                <option value="Cryptography">Cryptography</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as Severity)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Language</label>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as ProgrammingLanguage)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none focus:border-slate-900"
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="java">Java</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Flawed Vulnerability Code *</label>
            <textarea
              required
              rows={5}
              placeholder="Paste vulnerable code snippet..."
              value={vulnerableCode}
              onChange={e => setVulnerableCode(e.target.value)}
              className="w-full p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-xs border border-slate-800 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Vulnerable Line Numbers</label>
              <input
                type="text"
                placeholder="e.g. 4, 5"
                value={vulnerabilityLines}
                onChange={e => setVulnerabilityLines(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                placeholder="e.g. fastapi, sql, owasp"
                value={tags}
                onChange={e => setTags(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Vulnerability Description & Impact</label>
            <textarea
              rows={2}
              placeholder="Explain the security flaw..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Attack Scenario / Exploit Vector</label>
            <input
              type="text"
              placeholder="e.g. Attacker sends query=' OR '1'='1 to extract confidential records"
              value={attackScenario}
              onChange={e => setAttackScenario(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Verified Ground-Truth Remediation (Secure Patch)</label>
            <textarea
              rows={4}
              placeholder="Paste secure patch replacement code..."
              value={expectedPatch}
              onChange={e => setExpectedPatch(e.target.value)}
              className="w-full p-2.5 bg-slate-900 text-slate-100 rounded font-mono text-xs border border-slate-800 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Patch Remediation Explanation</label>
            <input
              type="text"
              placeholder="e.g. Use parameterized SQL queries with bound parameters"
              value={patchExplanation}
              onChange={e => setPatchExplanation(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 text-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-slate-900 text-white rounded font-semibold hover:bg-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{submitting ? 'Saving...' : 'Add to Benchmark Suite'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
