'use client';

import React, { useEffect, useRef, useState } from 'react';

interface IntroTelemetryProps {
  onComplete: () => void;
}

const ALL_LOGS = [
  'INIT_SYSTEM_KERNEL: SECURE_EVAL_v1.0 [OK]',
  'ATTACHING GROUND_TRUTH AST VALIDATORS... [DONE]',
  'CALIBRATING MULTI-MODEL CWE REASONING CORES...',
  '01 // SQL_INJECTION_DETECTOR: [ ACTIVE ]',
  '02 // SSRF_NETWORK_ANALYZER: [ ACTIVE ]',
  '03 // DESERIALIZATION_GUARD: [ ACTIVE ]',
  '04 // ACCESS_CONTROL_IDOR_LOCATOR: [ ACTIVE ]',
  'BENCHMARK METRICS AGGREGATOR: INITIALIZED',
  'SYSTEM READY // LAUNCHING BENCHMARK INTERFACE...'
];

export default function IntroTelemetry({ onComplete }: IntroTelemetryProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'visual' | 'terminal' | 'exit'>('visual');
  const [terminalLines, setTerminalLines] = useState<string[]>([]);

  // Canvas wireframe orbital radar animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let angle = 0;
    let pulse = 0;

    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resize();
    window.addEventListener('resize', resize);

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = Math.min(cx, cy) * 0.55;

      // Coordinate Grid Lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;

      // Draw Grid
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Outer Target Reticle Rings
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.25, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Rotating Latitude / Longitude Ellipses
      for (let i = 0; i < 4; i++) {
        const tilt = (i * Math.PI) / 4 + angle * 0.5;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(tilt);
        ctx.beginPath();
        ctx.ellipse(0, 0, radius, radius * 0.45, 0, 0, Math.PI * 2);
        ctx.strokeStyle = i === 1 ? '#0f172a' : '#334155';
        ctx.lineWidth = i === 1 ? 2 : 1;
        ctx.stroke();
        ctx.restore();
      }

      // Dynamic Orbit Trajectory Arc
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle * 1.5);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.4, radius * 0.65, Math.PI / 6, 0, Math.PI * 1.4);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbiting Satellite / Node
      const nodeX = Math.cos(angle * 2) * radius * 1.4;
      const nodeY = Math.sin(angle * 2) * radius * 0.65;
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Central Globe / Core Target
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 0.35 + Math.sin(pulse) * 3, 0, Math.PI * 2);
      ctx.fill();

      // Axis crosshairs
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - radius * 1.3, cy);
      ctx.lineTo(cx + radius * 1.3, cy);
      ctx.moveTo(cx, cy - radius * 1.3);
      ctx.lineTo(cx, cy + radius * 1.3);
      ctx.stroke();

      angle += 0.015;
      pulse += 0.05;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Progress and Stage Timeline
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStage('exit');
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }

        // Switch to terminal logs at 50%
        if (prev === 45) {
          setStage('terminal');
        }

        return prev + 1;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Stream terminal lines
  useEffect(() => {
    if (stage === 'terminal') {
      const logInterval = setInterval(() => {
        setTerminalLines(prev => {
          if (prev.length < ALL_LOGS.length) {
            return [...prev, ALL_LOGS[prev.length]];
          }
          return prev;
        });
      }, 180);
      return () => clearInterval(logInterval);
    }
  }, [stage]);

  return (
    <div className={`fixed inset-0 z-50 bg-[#f8fafc] flex flex-col justify-between p-6 sm:p-10 font-mono text-slate-900 transition-opacity duration-700 ${stage === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-300 pb-4">
        <div className="flex items-center space-x-3">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-900 animate-pulse"></span>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-900">
            SECURE_EVAL // TELEMETRY & DIAGNOSTICS BOOT
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-xs text-slate-500 font-mono">SYS_STATUS: ACTIVE</span>
          <button 
            onClick={onComplete}
            className="px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-slate-800 transition-colors"
          >
            Skip [ESC]
          </button>
        </div>
      </div>

      {/* Center Dynamic Area (Canvas Telemetry vs Terminal Logs) */}
      <div className="flex-1 my-6 flex flex-col items-center justify-center relative overflow-hidden bg-white border border-slate-200 rounded-lg p-4">
        {stage === 'visual' ? (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <canvas ref={canvasRef} className="w-full h-[380px]" />
            <div className="absolute bottom-4 left-6 text-xs text-slate-600 space-y-0.5">
              <div>Z-INDEX // AXIS: [0.941, 0.128, 1.402]</div>
              <div>RADAR TRACK: 360° SPATIAL_CWE_SCAN</div>
            </div>
            <div className="absolute bottom-4 right-6 text-xs text-slate-600 text-right space-y-0.5">
              <div>AST_PARSER: LOADED</div>
              <div>ORBITAL_VALIDATOR: SYNCHRONIZED</div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full max-w-2xl flex flex-col justify-center space-y-2 p-6 font-mono text-xs">
            <div className="text-slate-400 mb-2 border-b border-slate-200 pb-1">
              === SECURE_EVAL DIAGNOSTIC BOOT STREAM ===
            </div>
            {terminalLines.map((log, index) => (
              <div key={index} className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-800 font-semibold">{log}</span>
                <span className="text-slate-500 text-[10px]">PASS</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="border-t border-slate-300 pt-4 space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
          <span>PROGRESS // {progress}%</span>
          <span>CALIBRATING AST SECURITY CORES</span>
          <span>ALL SYSTEMS: NOMINAL</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-slate-900 transition-all duration-100 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
