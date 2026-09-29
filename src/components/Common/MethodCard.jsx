const COLOR_STYLES = {
  green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  yellow: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400',
  rose: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
  null: 'bg-slate-500/10 border-slate-500/30 text-slate-400'
};

export default function MethodCard({
  title,
  subtitle,

  // NOVO (recomendado): 'green' | 'yellow' | 'rose' | null.
  // Vem pronto do evaluateCriteria() em calculationService.js e habilita
  // o semáforo de 3 estados (usado por Bastter, Baragiola e Caetano).
  color,
  statusText,

  // LEGADO: continua funcionando como antes (true/false/null), para telas
  // que ainda não migraram — ex.: Quarteto Fantástico (Bazin, Lynch, Graham,
  // Buffett), que hoje só retornam `approved: boolean`.
  // IMPORTANTE: se `color` for passado, ele tem prioridade sobre `approved`.
  approved,

  approvedText,
  // NOVO: texto do estado Amarelo. Se não vier, cai no approvedText (fallback seguro).
  attentionText,
  rejectedText,
  insufficientText,
  className = '',
  titleClassName = 'text-slate-300',
  compact = false
}) {
  const resolvedColor = color !== undefined
    ? color
    : (approved === null || approved === undefined ? null : (approved ? 'green' : 'rose'));

  const insufficient = resolvedColor === null || resolvedColor === undefined;
  const style = COLOR_STYLES[resolvedColor] || COLOR_STYLES.null;
  const textSize = compact ? 'text-[9px]' : 'text-[10px]';

  const resolvedStatusText = statusText || (insufficient
    ? insufficientText
    : resolvedColor === 'green'
    ? approvedText
    : resolvedColor === 'yellow'
    ? (attentionText || approvedText)
    : rejectedText);

  return (
    <div
      className={`flex flex-col justify-between h-full min-h-[110px] min-w-0 p-2.5 rounded-lg border ${style} ${textSize} ${className}`}
    >
      <div className={`min-w-0 break-words font-bold uppercase mb-1 pb-1 border-b border-slate-700/60 leading-tight ${titleClassName}`}>
        {title}
      </div>

      {subtitle && <div className="min-w-0 break-words leading-tight mb-2 text-slate-300 flex-1">{subtitle}</div>}

      <div className={`pt-1.5 border-t border-slate-700/60 font-semibold ${
        insufficient ? 'text-slate-400' : ''
      } mt-auto leading-tight`}>
        ● {resolvedStatusText}
      </div>
    </div>
  );
}
