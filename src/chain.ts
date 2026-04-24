import type { EvidenceRecord } from './types';

export const GENESIS_PREV_HASH = '0'.repeat(64);

export type VerifyResult =
  | { valid: true; count: number }
  | { valid: false; brokenAtId: string; expected: string; actual: string };

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => JSON.stringify(k) + ':' + canonicalJson(v));
  return '{' + entries.join(',') + '}';
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function computeRecordHash(
  record: Omit<EvidenceRecord, 'recordHash'>,
): Promise<string> {
  return sha256Hex(canonicalJson(record));
}

export async function writeRecord(
  chain: EvidenceRecord[],
  seed: Omit<EvidenceRecord, 'id' | 'prevHash' | 'recordHash'>,
): Promise<EvidenceRecord> {
  const last = chain[chain.length - 1];
  const prevHash = last ? last.recordHash : GENESIS_PREV_HASH;
  const id = `rec-${chain.length + 1}`;
  const withoutHash: Omit<EvidenceRecord, 'recordHash'> = {
    ...seed,
    id,
    prevHash,
  };
  const recordHash = await computeRecordHash(withoutHash);
  return { ...withoutHash, recordHash };
}

export async function verifyChain(chain: EvidenceRecord[]): Promise<VerifyResult> {
  let prev = GENESIS_PREV_HASH;
  for (const record of chain) {
    if (record.prevHash !== prev) {
      return {
        valid: false,
        brokenAtId: record.id,
        expected: prev,
        actual: record.prevHash,
      };
    }
    const { recordHash: stored, ...rest } = record;
    const expected = await computeRecordHash(rest);
    if (stored !== expected) {
      return {
        valid: false,
        brokenAtId: record.id,
        expected,
        actual: stored,
      };
    }
    prev = stored;
  }
  return { valid: true, count: chain.length };
}

export function tamperWithRecord(
  chain: EvidenceRecord[],
  id: string,
): EvidenceRecord[] {
  return chain.map((record) => {
    if (record.id !== id) return record;
    const flipped = record.result === 'pass' ? 'fail' : 'pass';
    return { ...record, result: flipped };
  });
}
