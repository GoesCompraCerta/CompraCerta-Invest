const DARK_CHART_COLORS = [
  '#3B82F6',
  '#F97316',
  '#84CC16',
  '#EC4899',
  '#8B5CF6',
  '#FACC15',
  '#06B6D4',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
  '#A855F7',
  '#22C55E',
  '#EAB308'
];

const LIGHT_CHART_COLORS = [
  '#0891B2',
  '#EA580C',
  '#65A30D',
  '#DB2777',
  '#7C3AED',
  '#CA8A04',
  '#0284C7',
  '#DC2626',
  '#047857',
  '#D97706',
  '#4F46E5',
  '#0F766E',
  '#9333EA',
  '#16A34A',
  '#A16207'
];

const GOLDEN_ANGLE = 137.508;

const getGeneratedChartColor = (index, isDarkMode) => {
  const hue = (index * GOLDEN_ANGLE) % 360;
  const saturation = isDarkMode ? 78 : 68;
  const lightness = isDarkMode ? 58 : 42;
  return `hsl(${hue.toFixed(1)}, ${saturation}%, ${lightness}%)`;
};

export const getChartColor = (index, isDarkMode = true) => {
  const palette = isDarkMode ? DARK_CHART_COLORS : LIGHT_CHART_COLORS;
  return palette[index] || getGeneratedChartColor(index, isDarkMode);
};
