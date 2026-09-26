# 🛡️ SecureEval — AI Code Security & Vulnerability Benchmark Platform

**SecureEval** is a specialized domain-specific evaluation platform that benchmarks how effectively Large Language Models (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, DeepSeek Coder V2, etc.) identify, localize, and remediate critical software security vulnerabilities (CWEs / OWASP Top 10).

---

## 🌟 Key Features

* **🏆 Multi-Model Benchmark Leaderboard**: Evaluates models on Vulnerability Detection, CWE Accuracy, Fault Localization, and Patch Correctness.
* **🔬 Vulnerability Teardown Explorer**: Side-by-side interactive code inspector showing vulnerable code blocks, attack vectors, and verified ground-truth remediations.
* **📊 CWE Domain Mastery Radar**: Multi-axis category analytics across Injection, SSRF, Insecure Deserialization, Hardcoded Secrets, IDOR, and Cryptography.
* **⚡ Deterministic Scoring Engine**: Fast, objective scoring rubrics combining AST checks, CWE classification, and secure patch validation.
* **📁 Curated AppSec Test Suite**: Verified real-world security scenarios in Python, JavaScript/Node.js, Go, and React.

---

## 🛠️ Tech Stack

* **Framework**: Next.js 14 (App Router) + TypeScript
* **Styling & UI**: Tailwind CSS + Lucide React
* **Data Visualization**: Recharts (Radar, Bar Charts)
* **Storage & Engine**: Embedded Relational Data Layer + REST API

---

## 🚀 Quick Start

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd secure-eval
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm start
```

---

## 📄 License
MIT License
