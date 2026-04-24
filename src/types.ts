export type Result = 'pass' | 'fail' | 'error';

export type CollectorAttestation = {
  collectorId: string;
  collectorVersion: string;
  sourceSystem: string;
  pullTimestamp: string;
};

export type EvidenceRecord = {
  id: string;
  controlId: string;
  controlVersion: string;
  runAt: string;
  result: Result;
  details: Record<string, unknown>;
  collectorAttestation: CollectorAttestation;
  prevHash: string;
  recordHash: string;
};

export type PublishedTip = {
  tipHash: string;
  publishedAt: string;
};
