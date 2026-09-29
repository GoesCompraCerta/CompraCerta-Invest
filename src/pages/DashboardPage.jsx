import React from 'react';
import BenchmarkChart from '../components/Dashboard/BenchmarkChart';
import PortfolioChart from '../components/Dashboard/PortfolioChart';
import PositionSummary from '../components/Dashboard/PositionSummary';

export default function DashboardPage({
  totals,
  formatMoney,
  themeStyle,
  cardClass,
  isDarkMode,
  pieRadiusLevel,
  setPieRadiusLevel,
  t
}) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PortfolioChart
          assets={totals.list}
          patrimonio={totals.patrimonio}
          formatMoney={formatMoney}
          isDarkMode={isDarkMode}
          pieRadiusLevel={pieRadiusLevel}
          setPieRadiusLevel={setPieRadiusLevel}
          t={t}
        />
        <PositionSummary
          assets={totals.list}
          formatMoney={formatMoney}
          isDarkMode={isDarkMode}
          cardClass={cardClass}
          t={t}
        />
      </div>

      <BenchmarkChart
        totals={totals}
        isDarkMode={isDarkMode}
        cardClass={cardClass}
        t={t}
      />
    </div>
  );
}
