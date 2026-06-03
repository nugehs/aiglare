import fs from 'node:fs';
import path from 'node:path';
import { walkFiles, analyzeFile, scoreSeverity } from './discovery/native-scanner.js';
import { findRepoctxIndex, loadRepoctxHints, refineWithHints } from './discovery/repoctx-adapter.js';
import { buildSummary } from './report/reporter.js';

// Core audit. Pure: returns the report object, never touches the console or
// process exit code. Shared by the CLI and the MCP server so both surface
// identical results.
//
// options: { path, sinks?: string[], severity?: 'red'|'amber', ci?: boolean }
export function runAudit(options = {}) {
  const root = path.resolve(options.path ?? process.cwd());
  if (!fs.existsSync(root)) {
    throw new Error(`Path not found: ${root}`);
  }

  // Optional repoctx acceleration.
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
  if (options.sinks) surfaces = surfaces.filter(s => options.sinks.includes(s.sink));
  if (options.severity === 'red') surfaces = surfaces.filter(s => s.severity === 'red');
  else if (options.severity === 'amber') surfaces = surfaces.filter(s => s.severity !== 'green');

  const summary = buildSummary(surfaces);
  const blocking = surfaces.filter(s => s.severity === 'red' && s.sink === 'side-effectful').length;

  return {
    ok: true,
    repo: path.basename(root),
    acceleratedBy: rc ? `repoctx index (${rc.fileCount} files)` : null,
    surfaceCount: surfaces.length,
    summary,
    surfaces,
    gate: options.ci ? { passed: blocking === 0, blocking } : null,
  };
}
