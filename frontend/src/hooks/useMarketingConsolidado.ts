import { useEffect, useState, useMemo } from 'react';
import { marketingSummaryApi } from '../api/api';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function extractMonthColumns(row: any) {
  return Object.keys(row).filter(
    col =>
      /^amount_\d{4}_\d{2}$/.test(col) ||
      /^\d{4}_\d{2}$/.test(col) ||
      MONTHS_ES.map(m => m.toUpperCase()).includes(col.toUpperCase())
  );
}

function tidyMonthCol(col: string) {
  let match = col.match(/(\d{4})_(\d{2})$/);
  if (!match) match = col.match(/amount_(\d{4})_(\d{2})$/);
  if (match) {
    const year = match[1];
    const monthIdx = parseInt(match[2], 10) - 1;
    return `${MONTHS_ES[monthIdx]} ${year}`;
  }
  const idx = MONTHS_ES.map(m => m.toUpperCase()).indexOf(col.toUpperCase());
  if (idx !== -1) {
    const year = new Date().getFullYear();
    return `${MONTHS_ES[idx]} ${year}`;
  }
  return col;
}

function generatePeriods(allMonthCols: string[]) {
  const sorted = [...allMonthCols].sort((a, b) => {
    const parse = (col: string) => {
      let m = col.match(/(\d{4})_(\d{2})$/);
      if (!m) m = col.match(/amount_(\d{4})_(\d{2})$/);
      if (m) return parseInt(m[1]) * 100 + parseInt(m[2]);
      return 99999999;
    };
    return parse(a) - parse(b);
  });
  const periods = [];
  for (let i = 0; i < sorted.length; i += 12) {
    periods.push({
      label: `${tidyMonthCol(sorted[i])} - ${tidyMonthCol(sorted[Math.min(i+11, sorted.length-1)])}`,
      months: sorted.slice(i, i+12)
    });
  }
  return periods;
}

export default function useMarketingConsolidado() {
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchViews() {
      setLoading(true);
      setError(null);
      try {
        const resp = await marketingSummaryApi.getMarketingSummaryViews();
        const names: string[] = resp.data || [];
        const viewData: any[] = await Promise.all(
          names.map(async (viewName) => {
            try {
              const res = await marketingSummaryApi.getMarketingSummaryView(viewName);
              return { viewName, data: res.data, loading: false, error: null };
            } catch (err: any) {
              return { viewName, data: [], loading: false, error: 'Error al cargar datos de la vista' };
            }
          })
        );
        setViews(viewData);
      } catch (err) {
        setError('No se pudieron cargar las vistas de resumen de marketing');
      } finally {
        setLoading(false);
      }
    }
    fetchViews();
  }, []);

  const consolidated = useMemo(() => {
    if (views.length === 0) return null;
    const allRows = views.flatMap(v => v.data);
    if (allRows.length === 0) return null;
    const categories = Array.from(new Set(allRows.map(row => row.categoria || row.category)));
    const allMonthCols = Array.from(new Set(allRows.flatMap(row => extractMonthColumns(row))));
    const otherCols = Object.keys(allRows[0]).filter(col => !extractMonthColumns(allRows[0]).includes(col) && col !== 'categoria' && col !== 'category');
    const consolidatedRows = categories.map(cat => {
      const rowsForCat = allRows.filter(row => (row.categoria || row.category) === cat);
      const result: any = { categoria: cat };
      allMonthCols.forEach(col => {
        result[col] = rowsForCat.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
      });
      otherCols.forEach(col => {
        result[col] = rowsForCat.reduce((sum, row) => sum + (Number(row[col]) || 0), 0);
      });
      return result;
    });
    return { allMonthCols, otherCols, rows: consolidatedRows };
  }, [views]);

  const periods = useMemo(() => {
    if (!consolidated) return [];
    return generatePeriods(consolidated.allMonthCols);
  }, [consolidated]);

  return { consolidated, periods, loading, error };
} 