type FrameworkCard = {
  framework: string;
  clause: string;
  rationale: string;
  badgeClass: string;
};

const CARDS: FrameworkCard[] = [
  {
    framework: 'SOX',
    clause: 'COBIT-APO07.06',
    rationale:
      "Quarterly review of logical access for financially significant systems supports management's ICFR assertion under PCAOB AS 2201.",
    badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  },
  {
    framework: 'SOC 2',
    clause: 'CC6.3',
    rationale:
      'The entity modifies or removes access based on roles and responsibilities. Quarterly review is the operating effectiveness test.',
    badgeClass: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  },
  {
    framework: 'ISO 27001',
    clause: 'A.5.18',
    rationale:
      'Access rights are reviewed at planned intervals. Quarterly satisfies the planned-interval requirement for privileged access.',
    badgeClass: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  },
  {
    framework: 'ISO 42001',
    clause: 'A.4.3',
    rationale:
      'When applied to AI systems in the inventory, this satisfies AI-specific access management.',
    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  },
];

export function FrameworkCoverage() {
  return (
    <section className="space-y-3 border-t border-neutral-800 pt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-wider text-neutral-500">
          Framework Coverage
        </h2>
      </div>
      <p className="text-xs text-neutral-500 leading-relaxed">
        One control. Four frameworks. Test once, report everywhere.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CARDS.map((card) => (
          <div
            key={card.framework}
            className="rounded-lg border border-neutral-800 bg-neutral-900/40 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded border ${card.badgeClass}`}
              >
                {card.framework}
              </span>
              <span className="text-xs font-mono text-neutral-300">
                {card.clause}
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {card.rationale}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
