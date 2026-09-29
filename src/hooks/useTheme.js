import { useState, useMemo, useCallback } from 'react';
import { formatMoney as fmt } from '../utils/formatters';

export const useTheme = () => {
  const [lang, setLang] = useState('pt');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [themeColor, setThemeColor] = useState('emerald');

  const formatMoney = useCallback((value) => fmt(value, privacyMode), [privacyMode]);

  const themeStyle = useMemo(() => {
    const styles = {
      emerald: {
        btn: 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold',
        text: 'text-emerald-400'
      },
      blue: {
        btn: 'bg-sky-500 hover:bg-sky-600 text-slate-950 font-bold',
        text: 'text-sky-400'
      },
      purple: {
        btn: 'bg-purple-500 hover:bg-purple-600 text-white font-bold',
        text: 'text-purple-400'
      }
    };
    return styles[themeColor] || styles.emerald;
  }, [themeColor]);

  const cardClass = useMemo(
    () =>
      isDarkMode
        ? 'bg-[#111827] border-slate-800'
        : 'bg-[#ffffff] border border-[#bbf7d0] shadow-sm',
    [isDarkMode]
  );

  return {
    lang,
    setLang,
    isDarkMode,
    setIsDarkMode,
    privacyMode,
    setPrivacyMode,
    themeColor,
    setThemeColor,
    formatMoney,
    themeStyle,
    cardClass
  };
};
