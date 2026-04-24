import { useEffect, useState } from 'react';
import { canonicalJson, sha256Hex } from './chain';

type Verdict = 'allow' | 'warn' | 'block';

type DecisionEntry = {
  timestamp: string;
  system: string;
  verdict: Verdict;
  policy: string;
  rationale: string;
};

const ENTRIES: DecisionEntry[] = [
  {
    timestamp: '2025-10-15T14:22:03Z',
    system: 'internal-claude-assistant',
    verdict: 'allow',
    policy: 'standard-usage',
    rationale:
      'Prompt contained no PII, no production data markers. Standard internal assistant use.',
  },
  {
    timestamp: '2025-10-15T14:47:12Z',
    system: 'internal-claude-assistant',
    verdict: 'warn',
    policy: 'no-pii-in-prompts',
    rationale:
      'Prompt matched email regex. User warned, request proceeded with logging.',
  },
  {
    timestamp: '2025-10-15T15:03:45Z',
    system: 'external-chatgpt-plugin',
    verdict: 'block',
    policy: 'no-production-data-to-external',
    rationale:
      "Prompt contained customer record tagged 'production'. Blocked per policy.",
  },
];

function formatTs(iso: string): string {
  return iso.replace('T', ' ').replace('Z', ' UTC');
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const styles =
    verdict === 'allow'
      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
      : verdict === 'warn'
        ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
        : 'bg-red-500/15 text-red-300 border-red-500/30';
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded border ${styles}`}
    >
      {verdict}
    </span>
  );
}

export function AiPolicyDecisions() {
  const [hashes, setHashes] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const computed = await Promise.all(
        ENTRIES.map((entry) => sha256Hex(canonicalJson(entry))),
      );
      setHashes(computed);
    })();
  }, []);

  return (
    <section className="space-y-3 border-t border-neutral-800 pt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-wider text-neutral-500">
          AI Policy Decisions
        </h2>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">
        Every internal AI call routes through an audited wrapper. Same
        primitives as the ITGC chain.
      </p>
      <div className="space-y-2">
        {ENTRIES.map((entry, i) => {
          const hash = hashes[i];
          const preview = hash ? hash.slice(0, 8) : '........';
          return (
            <div
              key={i}
              className="rounded-md border border-indigo-500/25 bg-indigo-500/5 p-3 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="text-xs font-mono text-neutral-500">
                    {formatTs(entry.timestamp)}
                  </div>
                  <div className="text-xs text-neutral-300 truncate">
                    <span className="text-neutral-400">{entry.system}</span>
                    <span className="text-neutral-600"> · </span>
                    <span className="text-neutral-500">{entry.policy}</span>
                  </div>
                </div>
                <div className="shrink-0">
                  <VerdictBadge verdict={entry.verdict} />
                </div>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {entry.rationale}
              </p>
              <div className="text-xs font-mono text-neutral-600">
                decision_hash:{' '}
                <span className="text-neutral-400">{preview}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
