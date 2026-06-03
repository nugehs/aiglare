#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { walkFiles, analyzeFile, scoreSeverity } from './discovery/native-scanner.js';
import { findRepoctxIndex, loadRepoctxHints, refineWithHints } from './discovery/repoctx-adapter.js';
import { renderTerminal, buildSummary } from './report/reporter.js';

function parseArgs(argv) {
  const args = { path: process.cwd(), json: false, ci: false, severity: null, sinks: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') args.json = true;
    else if (a === '--ci') args.ci = true;
    else if (a === '--severity') {
      args.severity = argv[++i];
      if (!['red', 'amber'].includes(args.severity)) { console.error('--severity must be "red" or "amber"'); process.exit(2); }
    }
    else if (a === '--sinks') {
      const v = argv[++i];
      if (!v) { console.error('--sinks needs a comma-separated list (user-facing,side-effectful,internal)'); process.exit(2); }
      args.sinks = v.split(',').map(s => s.trim()).filter(Boolean);
    }
    else if (a === '--help' || a === '-h') args.help = true;
    else if (!a.startsWith('-')) args.path = path.resolve(a);
  }
  return args;
}

const HELP = `
aiglare — audit AI/LLM features for governance guardrails

Usage:  aiglare [path] [options]

Options:
  --json            Emit JSON instead of a terminal report
  --ci              Exit non-zero if any red side-effectful surface is found
  --severity <lvl>  Only show surfaces at this level or worse (red|amber)
  --sinks <list>    Filter to sinks: user-facing,side-effectful,internal
  -h, --help        Show this help

Detects where model output reaches users or side-effects (payment, booking,
email, db writes) without confidence handling, fallbacks, validation, or
human-in-the-loop. Standalone; uses a repoctx index automatically if present.
`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); process.exit(0); }

  const root = args.path;
  if (!fs.existsSync(root)) { console.error(`Path not found: ${root}`); process.exit(2); }

  // Optional repoctx acceleration
  const idxPath = findRepoctxIndex(root);
  const rc = idxPath ? loadRepoctxHints(idxPath, root) : null;

  // Discovery: if repoctx gave candidates, scan those first (fast path); always
  // fall back to a full native walk so nothing provider-imported is missed.
  const allFiles = walkFiles(root);
  const ordered = rc?.candidates
    ? [...allFiles].sort((a, b) => (rc.candidates.has(b) ? 1 : 0) - (rc.candidates.has(a) ? 1 : 0))
    : allFiles;

  let surfaces = [];
  for (const f of ordered) {
    const r = analyzeFile(f);
    if (r) {
      const refined = refineWithHints(r, rc?.hints);
      refined.severity = scoreSeverity(refined.sink, refined.guardrails);
      delete refined.file_abs;
      delete refined._humanInLoopSignal;
      surfaces.push(refined);
    }
  }

  // make paths repo-relative for readability
  surfaces = surfaces.map(s => ({ ...s, file: path.relative(root, s.file) }));

  // filters
  if (args.sinks) surfaces = surfaces.filter(s => args.sinks.includes(s.sink));
  if (args.severity === 'red') surfaces = surfaces.filter(s => s.severity === 'red');
  else if (args.severity === 'amber') surfaces = surfaces.filter(s => s.severity !== 'green');

  const summary = buildSummary(surfaces);
  const blocking = surfaces.filter(s => s.severity === 'red' && s.sink === 'side-effectful').length;

  const report = {
    ok: true,
    repo: path.basename(root),
    acceleratedBy: rc ? `repoctx index (${rc.fileCount} files)` : null,
    surfaceCount: surfaces.length,
    summary,
    surfaces,
    gate: args.ci ? { passed: blocking === 0, blocking } : null,
  };

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(renderTerminal(report));

  if (args.ci && blocking > 0) process.exit(1);
}

main();
