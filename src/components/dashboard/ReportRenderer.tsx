/**
 * Renders AI-generated research notes and strategy reports
 * as clean, professional UI instead of raw markdown.
 */

interface Props {
  content: string;
  type: 'research' | 'strategy';
}

// Section config — maps emoji/keyword to label + color
const RESEARCH_SECTIONS = [
  { match: /🔬|TOP TRENDS/i,        label: "What's Trending Now",          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { match: /🏆|COMPETITOR WINS/i,   label: "What's Working in Your Industry", color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
  { match: /😤|AUDIENCE PAIN/i,     label: 'What Your Audience Wants',     color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { match: /💡|OPPORTUNITY/i,       label: 'Your Best Opportunity',        color: 'text-green-400',  bg: 'bg-green-500/10',  border: 'border-green-500/20' },
  { match: /📚|SOURCES/i,           label: 'Research Sources',             color: 'text-muted-foreground', bg: 'bg-secondary/40', border: 'border-border/40' },
];

// Strip leading markdown symbols from a line
function cleanLine(line: string): string {
  return line
    .replace(/^#{1,4}\s*/, '')          // ### headings
    .replace(/\*\*(.+?)\*\*/g, '$1')    // **bold**
    .replace(/\*(.+?)\*/g, '$1')        // *italic*
    .replace(/^[-•]\s+/, '')            // bullet dashes
    .replace(/\[\d+\]/g, '')            // citation refs like [1]
    .trim();
}

// Inline bold: splits text at **word** markers for rendering
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function parseLines(raw: string): { bullets: string[]; prose: string[] } {
  const bullets: string[] = [];
  const prose: string[] = [];
  raw.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    // Skip lines that are just section headers
    if (/^#{1,4}\s/.test(trimmed)) return;
    if (/^(🔬|🏆|😤|💡|📚)/.test(trimmed) && trimmed.length < 60) return;
    if (/\*\*TOP TRENDS|COMPETITOR WINS|AUDIENCE PAIN|OPPORTUNITY|SOURCES\*\*/i.test(trimmed) && trimmed.length < 60) return;

    if (/^[-•*]\s/.test(trimmed)) {
      bullets.push(cleanLine(trimmed));
    } else {
      prose.push(trimmed);
    }
  });
  return { bullets, prose };
}

function ResearchReport({ content }: { content: string }) {
  // Split content into sections by detecting emoji or keyword headers
  const sectionBlocks: { config: typeof RESEARCH_SECTIONS[0]; body: string }[] = [];
  let remaining = content;

  RESEARCH_SECTIONS.forEach((cfg, idx) => {
    const nextCfgs = RESEARCH_SECTIONS.slice(idx + 1);
    // Build a regex to split at this section's header
    const headerPattern = new RegExp(
      `(?:^|\\n)(?:#{1,4}\\s*)?(?:${cfg.match.source}).*?(?=\\n|$)`,
      'i'
    );
    const match = remaining.match(headerPattern);
    if (!match || match.index === undefined) return;

    const afterHeader = remaining.slice(match.index + match[0].length);

    // Find where next known section starts
    let endIdx = afterHeader.length;
    nextCfgs.forEach((nxt) => {
      const nxtPattern = new RegExp(
        `(?:^|\\n)(?:#{1,4}\\s*)?(?:${nxt.match.source})`,
        'i'
      );
      const nxtMatch = afterHeader.match(nxtPattern);
      if (nxtMatch && nxtMatch.index !== undefined && nxtMatch.index < endIdx) {
        endIdx = nxtMatch.index;
      }
    });

    sectionBlocks.push({ config: cfg, body: afterHeader.slice(0, endIdx).trim() });
  });

  // Fallback: if no sections detected, just render raw cleaned lines
  if (sectionBlocks.length === 0) {
    return (
      <div className="space-y-1 text-sm text-muted-foreground font-body">
        {content.split('\n').filter(Boolean).map((line, i) => (
          <p key={i}>{renderInline(cleanLine(line))}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sectionBlocks.map(({ config, body }, i) => {
        const { bullets, prose } = parseLines(body);
        const isSources = /SOURCES/i.test(config.label);
        return (
          <div key={i} className={`rounded-lg border ${config.border} ${config.bg} p-4`}>
            <p className={`text-xs font-display font-bold uppercase tracking-widest mb-2 ${config.color}`}>
              {config.label}
            </p>
            {isSources ? (
              <div className="space-y-1">
                {body.split('\n').filter(l => l.trim()).map((line, j) => {
                  const urlMatch = line.match(/https?:\/\/[^\s]+/);
                  const numMatch = line.match(/^\[(\d+)\]/);
                  if (urlMatch) {
                    return (
                      <a key={j} href={urlMatch[0]} target="_blank" rel="noopener noreferrer"
                        className="block text-xs text-blue-400 hover:text-blue-300 hover:underline truncate font-body transition-colors">
                        {numMatch ? `[${numMatch[1]}] ` : ''}{urlMatch[0]}
                      </a>
                    );
                  }
                  return null;
                })}
              </div>
            ) : (
              <div className="space-y-2">
                {bullets.length > 0 && (
                  <ul className="space-y-2">
                    {bullets.map((b, j) => (
                      <li key={j} className="flex gap-2 text-sm font-body text-muted-foreground">
                        <span className={`mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full ${config.color.replace('text-', 'bg-')} mt-1.5`} />
                        <span className="leading-relaxed">{renderInline(b)}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {prose.map((p, j) => (
                  <p key={j} className="text-sm font-body text-muted-foreground leading-relaxed">
                    {renderInline(cleanLine(p))}
                  </p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StrategyReport({ content }: { content: string }) {
  // Split by ### headings
  const sections: { title: string; body: string }[] = [];
  const lines = content.split('\n');
  let current: { title: string; lines: string[] } | null = null;

  lines.forEach((line) => {
    if (/^#{1,4}\s/.test(line.trim())) {
      if (current) sections.push({ title: current.title, body: current.lines.join('\n') });
      const rawTitle = cleanLine(line.trim())
        .replace(/\s*Content Pillar\s*/i, ' Strategy')
        .trim();
      current = { title: rawTitle, lines: [] };
    } else if (current) {
      current.lines.push(line);
    }
  });
  if (current) sections.push({ title: current.title, body: current.lines.join('\n') });

  if (sections.length === 0) {
    return (
      <div className="space-y-1 text-sm text-muted-foreground font-body">
        {content.split('\n').filter(Boolean).map((line, i) => (
          <p key={i}>{renderInline(cleanLine(line))}</p>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sections.map(({ title, body }, i) => {
        const { bullets, prose } = parseLines(body);
        const isSchedule = /schedule/i.test(title);
        return (
          <div key={i} className="rounded-lg border border-border/30 bg-secondary/20 p-4">
            <p className="text-xs font-display font-bold uppercase tracking-widest text-primary mb-3">
              {title}
            </p>
            <div className="space-y-2">
              {bullets.map((b, j) => (
                <div key={j} className={`flex gap-2 text-sm font-body text-muted-foreground ${isSchedule ? 'items-start' : ''}`}>
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary/60 mt-1.5" />
                  <span className="leading-relaxed">{renderInline(b)}</span>
                </div>
              ))}
              {prose.map((p, j) => {
                const cleaned = cleanLine(p);
                if (!cleaned) return null;
                // Detect "Label: value" lines
                const colonIdx = cleaned.indexOf(':');
                if (colonIdx > 0 && colonIdx < 30) {
                  const label = cleaned.slice(0, colonIdx).trim();
                  const value = cleaned.slice(colonIdx + 1).trim();
                  return (
                    <div key={j} className="flex gap-2 text-sm font-body">
                      <span className="text-foreground font-semibold shrink-0">{label}:</span>
                      <span className="text-muted-foreground leading-relaxed">{renderInline(value)}</span>
                    </div>
                  );
                }
                return (
                  <p key={j} className="text-sm font-body text-muted-foreground leading-relaxed">
                    {renderInline(cleaned)}
                  </p>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ReportRenderer({ content, type }: Props) {
  if (!content) return null;
  return type === 'research'
    ? <ResearchReport content={content} />
    : <StrategyReport content={content} />;
}
