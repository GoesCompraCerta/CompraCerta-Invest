export const sanitizeIbovespaSeries = (series) => {
  let previousValidValue = null;

  return series.map((point, index) => {
    let ibovespa = point.ibovespa;

    if (Number.isFinite(ibovespa) && ibovespa < -100) {
      ibovespa = previousValidValue ?? 0;
    } else if (ibovespa == null && index === series.length - 1) {
      ibovespa = previousValidValue;
    }

    if (Number.isFinite(ibovespa)) previousValidValue = ibovespa;
    return { ...point, ibovespa: ibovespa ?? null };
  });
};
