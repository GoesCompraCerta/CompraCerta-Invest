import React, { useState } from 'react';
import { Edit3, Trash2 } from 'lucide-react';

const formatDateInput = (value) => {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
};

const toStoredDate = (value) => {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  return match ? `${match[3]}-${match[2]}-${match[1]}` : value;
};

export default function ProventosPage({
  proventos,
  formatMoney,
  themeStyle,
  cardClass,
  t,
  onAddProvento,
  onUpdateProvento,
  onDeleteProvento
}) {
  const [editingProvId, setEditingProvId] = useState(null);
  const [formData, setFormData] = useState({
    ticker: '',
    value: '',
    type: 'Dividendos',
    date: ''
  });

  const handleSaveProvento = (e) => {
    e.preventDefault();
    if (!formData.ticker || !formData.value) return;

    const entry = {
      ticker: formData.ticker.toUpperCase(),
      value: Number(formData.value),
      type: formData.type,
      date: toStoredDate(formData.date) || new Date().toISOString().split('T')[0]
    };

    if (editingProvId) {
      onUpdateProvento(editingProvId, entry);
      setEditingProvId(null);
    } else {
      onAddProvento(entry);
    }

    setFormData({ ticker: '', value: '', type: 'Dividendos', date: '' });
  };

  const handleEditProvento = (p) => {
    setEditingProvId(p.id);
    setFormData({
      ticker: p.ticker,
      value: String(p.value),
      type: p.type || 'Dividendos',
      date: formatDateInput(p.date)
    });
  };

  const handleCancel = () => {
    setEditingProvId(null);
    setFormData({ ticker: '', value: '', type: 'Dividendos', date: '' });
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border space-y-4 ${cardClass}`}>
        <h3 className="font-bold text-sm">{t.lancarProventos}</h3>
        <form onSubmit={handleSaveProvento} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.ticker}
            </label>
            <input
              type="text"
              placeholder=""
              value={formData.ticker}
              onChange={(e) => setFormData({ ...formData, ticker: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.valorRecebido}
            </label>
            <input
              type="number"
              step="0.01"
              placeholder=""
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">{t.tipoProvento}</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Dividendos">{t.dividendos}</option>
              <option value="JCP">{t.jcp}</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-400">
              {t.dataRecebimento}
            </label>
            <input
              type="text"
              inputMode="numeric"
              placeholder=""
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: formatDateInput(e.target.value) })}
              className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>
          <div className="sm:col-span-4 flex justify-end gap-2">
            {editingProvId && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold text-rose-400 border border-rose-500/30"
              >
                {t.cancelar}
              </button>
            )}
            <button type="submit" className={`px-6 py-2 rounded-xl text-xs font-bold ${themeStyle.btn}`}>
              {editingProvId ? t.salvar : t.adicionar}
            </button>
          </div>
        </form>
      </div>

      <div className={`p-6 rounded-2xl border space-y-3 ${cardClass}`}>
        <h3 className="font-bold text-sm">{t.extratoEntradas}</h3>
        <div className="space-y-2">
          {proventos && proventos.length > 0 ? (
            proventos.map((p) => (
              <div
                key={p.id}
                className="extrato-entrada-item p-3 rounded-xl bg-slate-900/30 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-bold text-white">{p.ticker}</div>
                  <div className="text-[10px] text-slate-400">{p.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-400">
                    {formatMoney(p.value)}
                  </span>
                  <button
                    onClick={() => handleEditProvento(p)}
                    className="text-slate-400 hover:text-sky-400"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteProvento(p.id)}
                    className="text-slate-400 hover:text-rose-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 text-xs py-6">
              {t.semDados}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
