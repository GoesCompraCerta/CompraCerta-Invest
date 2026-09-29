import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function KPICards({ totals, formatMoney, themeStyle, cardClass, t, privacyMode, setPrivacyMode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className={`p-4 rounded-2xl border ${cardClass}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            {t.patrimonioTotal}
          </span>
          <button
            type="button"
            onClick={() => setPrivacyMode((current) => !current)}
            className="rounded-lg p-1 text-slate-400 transition hover:text-emerald-400"
            title={privacyMode ? 'Mostrar valores' : 'Ocultar valores'}
            aria-label={privacyMode ? 'Mostrar valores' : 'Ocultar valores'}
          >
            {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <div className={`text-xl font-black mt-1 ${themeStyle.text}`}>
          {formatMoney(totals.patrimonio)}
        </div>
      </div>
      <div className={`p-4 rounded-2xl border ${cardClass}`}>
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {t.totalInvestido}
        </span>
        <div className="text-xl font-black mt-1">{formatMoney(totals.investido)}</div>
      </div>
      <div className={`p-4 rounded-2xl border ${cardClass}`}>
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {t.lucroRentabilidade}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <span
            className={`text-xl font-black ${
              totals.lucroTotal >= 0 ? 'text-emerald-400' : 'text-rose-500'
            }`}
          >
            {formatMoney(totals.lucroTotal)}
          </span>
          <span className="text-xs font-bold text-slate-400">
            ({totals.rentabilidadeTotal >= 0 ? '+' : ''}
            {totals.rentabilidadeTotal.toFixed(2)}%)
          </span>
        </div>
      </div>
      <div className={`p-4 rounded-2xl border ${cardClass}`}>
        <span className="text-[10px] font-bold text-slate-400 uppercase">
          {t.proventosRecebidos}
        </span>
        <div className="text-xl font-black text-emerald-400 mt-1">
          {formatMoney(totals.totalProventos)}
        </div>
      </div>
    </div>
  );
}
