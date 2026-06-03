#!/usr/bin/env node
import path from 'node:path';
import { runAudit } from './audit.js';
import { renderTerminal } from './report/reporter.js';
import { startMcpServer } from './mcp.js';

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
        aiglare mcp                 Start the MCP server (stdio)

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

async function main() {
  const argv = process.argv.slice(2);

  // Subcommand: `aiglare mcp` starts the stdio MCP server.
  if (argv[0] === 'mcp') {
    await startMcpServer();
    return;
  }

  const args = parseArgs(argv);
  if (args.help) { console.log(HELP); process.exit(0); }

  let report;
  try {
    report = runAudit(args);
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(2);
  }

  if (args.json) console.log(JSON.stringify(report, null, 2));
  else console.log(renderTerminal(report));

  if (args.ci && report.gate && !report.gate.passed) process.exit(1);
}

main();
