import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { EvidenceRecord, PublishedTip, Result } from './types';
import {
  writeRecord,
  verifyChain,
  tamperWithRecord,
  computeRecordHash,
  GENESIS_PREV_HASH,
} from './chain';
import type { VerifyResult } from './chain';
import { FIXTURES } from './fixtures';
import { FrameworkCoverage } from './FrameworkCoverage';
import { AiPolicyDecisions } from './AiPolicyDecisions';

const SYSTEMS = ['okta', 'github', 'aws', 'snowflake', 'salesforce'] as const;

type TipVerifyResult =
  | { valid: true; recordsSince: number }
  | { valid: false; brokenAtId: string };

function shortHash(hash: string): string {
  if (hash === GENESIS_PREV_HASH) return 'genesis';
  return hash.slice(0, 12);
}

function formatTimestamp(iso: string): string {
  return iso.replace('T', ' ').replace('.000Z', 'Z').replace('Z', ' UTC');
}

async function buildFixtureChain(): Promise<EvidenceRecord[]> {
  let chain: EvidenceRecord[] = [];
  for (const seed of FIXTURES) {
    const record = await writeRecord(chain, seed);
    chain = [...chain, record];
  }
  return chain;
}

async function verifyChainFromTip(
  chain: EvidenceRecord[],
  tip: PublishedTip,
): Promise<TipVerifyResult> {
  if (chain.length <= tip.recordIndex) {
    return { valid: false, brokenAtId: `rec-${tip.recordIndex + 1}` };
  }
  let prev = GENESIS_PREV_HASH;
  for (let i = 0; i < chain.length; i += 1) {
    const r = chain[i];
    if (!r) continue;
    if (r.prevHash !== prev) {
      return { valid: false, brokenAtId: r.id };
    }
    const { recordHash: stored, ...rest } = r;
    const expected = await computeRecordHash(rest);
    if (stored !== expected) {
      return { valid: false, brokenAtId: r.id };
    }
    if (i === tip.recordIndex && stored !== tip.tipHash) {
      return { valid: false, brokenAtId: r.id };
    }
    prev = stored;
  }
  return {
    valid: true,
    recordsSince: chain.length - tip.recordIndex - 1,
  };
}

export function App() {
  const [chain, setChain] = useState<EvidenceRecord[]>([]);
  const [publishedTips, setPublishedTips] = useState<PublishedTip[]>([]);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [tipVerifyResults, setTipVerifyResults] = useState<
    Record<number, TipVerifyResult>
  >({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      const initial = await buildFixtureChain();
      setChain(initial);
      setReady(true);
    })();
  }, []);

  const clearTransientResults = useCallback(() => {
    setVerifyResult(null);
    setTipVerifyResults({});
  }, []);

  const runControl = useCallback(async () => {
    const system = SYSTEMS[Math.floor(Math.random() * SYSTEMS.length)] ?? 'okta';
    const now = new Date().toISOString();
    const seed = {
      controlId: 'itgc-access-review-quarterly',
      controlVersion: '2.1.0',
      runAt: now,
      result: 'pass' as Result,
      details: {
        system,
        reviewedUsers: 20 + Math.floor(Math.random() * 100),
        flaggedForRemoval: Math.floor(Math.random() * 10),
        flaggedRevokedWithinSla: Math.floor(Math.random() * 10),
        quarter: 'Q4-2025',
      },
      collectorAttestation: {
        collectorId: `${system}-adapter`,
        collectorVersion: '1.0.0',
        sourceSystem: `${system}-prod`,
        pullTimestamp: now,
      },
    };
    const newRecord = await writeRecord(chain, seed);
    setChain([...chain, newRecord]);
    clearTransientResults();
  }, [chain, clearTransientResults]);

  const verify = useCallback(async () => {
    const result = await verifyChain(chain);
    setVerifyResult(result);
  }, [chain]);

  const reset = useCallback(async () => {
    const initial = await buildFixtureChain();
    setChain(initial);
    clearTransientResults();
  }, [clearTransientResults]);

  const tamper = useCallback(
    (id: string) => {
      setChain((prev) => tamperWithRecord(prev, id));
      clearTransientResults();
    },
    [clearTransientResults],
  );

  const currentTip = useMemo(() => {
    const last = chain[chain.length - 1];
    return last ? last.recordHash : GENESIS_PREV_HASH;
  }, [chain]);

  const publishTip = useCallback(() => {
    if (chain.length === 0) return;
    setPublishedTips((prev) => [
      ...prev,
      {
        tipHash: currentTip,
        publishedAt: new Date().toISOString(),
        recordIndex: chain.length - 1,
      },
    ]);
  }, [chain, currentTip]);

  const verifyFromTip = useCallback(
    async (tipIndex: number) => {
      const tip = publishedTips[tipIndex];
      if (!tip) return;
      const result = await verifyChainFromTip(chain, tip);
      setTipVerifyResults((prev) => ({ ...prev, [tipIndex]: result }));
    },
    [chain, publishedTips],
  );

  if (!ready) {
    return <div className="min-h-screen bg-neutral-950" />;
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12 space-y-8">
        <header className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
            Evidence Chain Demo
          </h1>
          <p className="text-sm text-neutral-400">
            Tamper-evident audit log for continuous controls monitoring.
          </p>
        </header>

        <section className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
          <p className="text-sm text-amber-100/80 leading-relaxed">
            This demonstrates hash-chained audit evidence. The chain detects
            tampering within itself. It does not protect against a database
            admin rewriting every record, which is why the External Anchor
            exists.
          </p>
        </section>

        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">
              Chain
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {chain.length} records
            </span>
          </div>
          <div className="space-y-3">
            {chain.map((record, index) => (
              <RecordCard
                key={record.id}
                record={record}
                index={index}
                onTamper={() => tamper(record.id)}
                broken={
                  verifyResult && !verifyResult.valid
                    ? verifyResult.brokenAtId === record.id
                    : false
                }
              />
            ))}
          </div>
        </section>

        <section className="flex flex-wrap gap-3">
          <Button onClick={runControl}>Run Control</Button>
          <Button onClick={verify} variant="primary">
            Verify Chain
          </Button>
          <Button onClick={reset} variant="subtle">
            Reset
          </Button>
        </section>

        {verifyResult ? <VerifyPanel result={verifyResult} /> : null}

        <FrameworkCoverage />

        <AiPolicyDecisions />

        <section className="space-y-3 border-t border-neutral-800 pt-8">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xs uppercase tracking-wider text-neutral-500">
              External Anchor
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              tip: {shortHash(currentTip)}
            </span>
          </div>
          <div>
            <Button onClick={publishTip} variant="subtle">
              Publish Current Tip
            </Button>
          </div>
          <ul className="space-y-2">
            {publishedTips.length === 0 ? (
              <li className="text-xs text-neutral-600">No tips published yet.</li>
            ) : null}
            {publishedTips.map((tip, i) => {
              const result = tipVerifyResults[i];
              return (
                <li
                  key={i}
                  className="rounded-md border border-neutral-800 bg-neutral-900/50 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-neutral-500">
                      {formatTimestamp(tip.publishedAt)}
                    </span>
                    <span className="text-emerald-400">
                      {shortHash(tip.tipHash)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-xs text-neutral-500">
                      covers records 1-{tip.recordIndex + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        void verifyFromTip(i);
                      }}
                      className="text-xs text-neutral-400 hover:text-neutral-100 border border-neutral-800 hover:border-neutral-600 rounded px-2 py-1 transition-colors"
                    >
                      Verify from this tip
                    </button>
                  </div>
                  {result ? (
                    <TipResultInline
                      result={result}
                      publishedAt={tip.publishedAt}
                    />
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-neutral-500 leading-relaxed">
            In production, tips are written to S3 Object Lock in Compliance
            mode. An auditor can verify any historical point by walking forward
            from the published tip, independent of the database state.
          </p>
        </section>

        <footer className="border-t border-neutral-800 pt-6">
          <p className="text-xs text-neutral-600">
            Built as a reference for continuous controls monitoring.
          </p>
        </footer>
      </main>
    </div>
  );
}

type ButtonProps = {
  onClick: () => void;
  children: ReactNode;
  variant?: 'default' | 'primary' | 'subtle';
};

function Button({ onClick, children, variant = 'default' }: ButtonProps) {
  const base =
    'px-4 py-2 rounded-md text-sm font-medium transition-colors select-none';
  const styles =
    variant === 'primary'
      ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/25'
      : variant === 'subtle'
        ? 'text-neutral-400 border border-transparent hover:text-neutral-200 hover:border-neutral-700'
        : 'bg-neutral-800 text-neutral-100 border border-neutral-700 hover:bg-neutral-700';
  return (
    <button onClick={onClick} className={`${base} ${styles}`} type="button">
      {children}
    </button>
  );
}

type RecordCardProps = {
  record: EvidenceRecord;
  index: number;
  onTamper: () => void;
  broken: boolean;
};

function RecordCard({ record, index, onTamper, broken }: RecordCardProps) {
  const systemRaw = record.details['system'];
  const system = typeof systemRaw === 'string' ? systemRaw : 'unknown';
  const border = broken
    ? 'border-red-500/50 bg-red-500/5'
    : 'border-neutral-800 bg-neutral-900/40';
  return (
    <div
      className={`rounded-lg border ${border} p-4 space-y-3 transition-colors`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-neutral-500">
              rec-{index + 1}
            </span>
            <span className="text-sm text-neutral-200 truncate">
              {record.controlId}
            </span>
          </div>
          <div className="text-xs text-neutral-500">
            <span className="text-neutral-400">{system}</span>
            <span> · </span>
            {formatTimestamp(record.runAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ResultBadge result={record.result} />
          <button
            onClick={onTamper}
            type="button"
            className="text-xs text-neutral-500 hover:text-amber-300 border border-neutral-800 hover:border-amber-500/40 rounded px-2 py-1 transition-colors"
          >
            Tamper
          </button>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:gap-6 gap-1 text-xs font-mono">
        <span className="text-neutral-600">
          prev:{' '}
          <span className="text-neutral-500">{shortHash(record.prevHash)}</span>
        </span>
        <span className="text-neutral-600">
          hash:{' '}
          <span className="text-neutral-300">
            {shortHash(record.recordHash)}
          </span>
        </span>
      </div>
    </div>
  );
}

function ResultBadge({ result }: { result: Result }) {
  if (result === 'pass') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
        pass
      </span>
    );
  }
  if (result === 'fail') {
    return (
      <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30">
        fail
      </span>
    );
  }
  return (
    <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
      error
    </span>
  );
}

function VerifyPanel({ result }: { result: VerifyResult }) {
  if (result.valid) {
    return (
      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
        <p className="text-sm text-emerald-200">
          Chain intact, {result.count} records verified.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-lg border border-red-500/40 bg-red-500/5 p-4 space-y-3">
      <p className="text-sm text-red-200">
        Chain broken at record {result.brokenAtId}: hash mismatch.
      </p>
      <div className="text-xs font-mono space-y-1">
        <div className="break-all">
          <span className="text-neutral-500">expected:</span>{' '}
          <span className="text-emerald-300">{result.expected}</span>
        </div>
        <div className="break-all">
          <span className="text-neutral-500">actual:&nbsp;&nbsp;</span>{' '}
          <span className="text-red-300">{result.actual}</span>
        </div>
      </div>
    </div>
  );
}

type TipResultInlineProps = {
  result: TipVerifyResult;
  publishedAt: string;
};

function TipResultInline({ result, publishedAt }: TipResultInlineProps) {
  if (result.valid) {
    return (
      <div className="rounded border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
        <p className="text-xs text-emerald-200">
          Chain intact from tip published at {formatTimestamp(publishedAt)},{' '}
          {result.recordsSince} records since.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded border border-red-500/40 bg-red-500/5 px-3 py-2">
      <p className="text-xs text-red-200">
        Chain diverges from tip at record {result.brokenAtId}.
      </p>
    </div>
  );
}
