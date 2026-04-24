import type { EvidenceRecord, CollectorAttestation } from './types';

export type FixtureSeed = Omit<EvidenceRecord, 'id' | 'prevHash' | 'recordHash'>;

const baseDate = '2025-09-30T';

function att(
  collectorId: string,
  sourceSystem: string,
  time: string,
): CollectorAttestation {
  return {
    collectorId,
    collectorVersion: '1.0.0',
    sourceSystem,
    pullTimestamp: `${baseDate}${time}.000Z`,
  };
}

export const FIXTURES: FixtureSeed[] = [
  {
    controlId: 'itgc-access-review-quarterly',
    controlVersion: '2.1.0',
    runAt: `${baseDate}08:00:00.000Z`,
    result: 'pass',
    details: {
      system: 'okta',
      reviewedUsers: 47,
      flaggedForRemoval: 3,
      flaggedRevokedWithinSla: 3,
      quarter: 'Q3-2025',
    },
    collectorAttestation: att('okta-adapter', 'okta-prod', '08:00:00'),
  },
  {
    controlId: 'itgc-access-review-quarterly',
    controlVersion: '2.1.0',
    runAt: `${baseDate}08:05:00.000Z`,
    result: 'pass',
    details: {
      system: 'github',
      reviewedUsers: 112,
      flaggedForRemoval: 8,
      flaggedRevokedWithinSla: 8,
      quarter: 'Q3-2025',
    },
    collectorAttestation: att('github-adapter', 'github-org-acme', '08:05:00'),
  },
  {
    controlId: 'itgc-access-review-quarterly',
    controlVersion: '2.1.0',
    runAt: `${baseDate}08:10:00.000Z`,
    result: 'fail',
    details: {
      system: 'aws',
      reviewedUsers: 29,
      flaggedForRemoval: 5,
      flaggedRevokedWithinSla: 2,
      reason:
        '3 privileged users did not complete reattestation within the 14-day SLA',
      quarter: 'Q3-2025',
    },
    collectorAttestation: att('aws-iam-adapter', 'aws-account-prod', '08:10:00'),
  },
  {
    controlId: 'itgc-access-review-quarterly',
    controlVersion: '2.1.0',
    runAt: `${baseDate}08:15:00.000Z`,
    result: 'pass',
    details: {
      system: 'snowflake',
      reviewedUsers: 18,
      flaggedForRemoval: 1,
      flaggedRevokedWithinSla: 1,
      quarter: 'Q3-2025',
    },
    collectorAttestation: att('snowflake-adapter', 'snowflake-prod', '08:15:00'),
  },
  {
    controlId: 'itgc-access-review-quarterly',
    controlVersion: '2.1.0',
    runAt: `${baseDate}08:20:00.000Z`,
    result: 'pass',
    details: {
      system: 'salesforce',
      reviewedUsers: 63,
      flaggedForRemoval: 4,
      flaggedRevokedWithinSla: 4,
      quarter: 'Q3-2025',
    },
    collectorAttestation: att(
      'salesforce-adapter',
      'salesforce-internal',
      '08:20:00',
    ),
  },
];
