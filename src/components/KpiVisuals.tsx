import React from 'react';

/**
 * Single-Hue Executive Crimson KPI Visual Components
 * Restrained palette: Solid Crimson (#C8102E) + Architectural Charcoal (#1F232A) + Neutral Gray (#E2E5EA) + Crisp White (#FFFFFF)
 */

export interface KpiTileItem {
  label: string;
  value: string | number;
  sublabel: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
}

export const KpiGraduatedStrip: React.FC<{
  items: KpiTileItem[];
  columns?: 3 | 4;
}> = ({ items, columns = 4 }) => {
  const gridCols =
    columns === 3
      ? 'grid-cols-1 sm:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-3.5`}>
      {items.map((item, idx) => {
        const Icon = item.icon;
        const isPrimary = idx === 0;
        const Wrapper = item.onClick ? 'button' : 'div';
        return (
          <Wrapper
            key={item.label}
            {...(item.onClick ? { type: 'button' as const, onClick: item.onClick } : {})}
            className={`text-left rounded-xl border p-4 sm:p-5 transition-all duration-150 flex flex-col justify-between gap-3 ${
              isPrimary
                ? 'bg-[#C8102E] border-[#A50D26] text-white shadow-xs'
                : 'bg-white border-slate-200 border-t-2 border-t-[#C8102E] text-slate-900 shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
            } ${
              item.onClick
                ? isPrimary
                  ? 'cursor-pointer hover:bg-[#A50D26]'
                  : 'cursor-pointer hover:border-[#C8102E] hover:shadow-sm'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-[11px] font-bold uppercase tracking-wider leading-snug ${
                  isPrimary ? 'text-white' : 'text-slate-600'
                }`}
              >
                {item.label}
              </p>
              {Icon && (
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isPrimary
                      ? 'bg-white/15 text-white'
                      : 'bg-[#FDF2F4] text-[#C8102E]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </span>
              )}
            </div>
            <div>
              <p
                className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight tabular-nums leading-none ${
                  isPrimary ? 'text-white' : 'text-slate-900'
                }`}
              >
                {item.value}
              </p>
              <p
                className={`text-[11px] font-medium mt-1.5 leading-snug ${
                  isPrimary ? 'text-white/95' : 'text-slate-600'
                }`}
              >
                {item.sublabel}
              </p>
            </div>
          </Wrapper>
        );
      })}
    </div>
  );
};

interface ArcGaugeProps {
  title: string;
  subtitle?: string;
  percentage: number;
  centerLabel?: string;
  legend?: Array<{ label: string; value: number | string; color: string }>;
}

const SINGLE_THEME_LEGEND_COLORS = ['#C8102E', '#9CA3AF', '#E2E5EA'];

export const PerformanceArcGauge: React.FC<ArcGaugeProps> = ({
  title,
  subtitle,
  percentage,
  centerLabel = 'Kinerja',
  legend = [],
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percentage)));
  const r = 72;
  const circumference = Math.PI * r;
  const filledLen = (clamped / 100) * circumference;

  return (
    <div className="kpi-card p-5 flex flex-col justify-between h-full">
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#FDF2F4] text-[#A50D26] border border-[#F5C6CE] shrink-0">
          KPI Meter
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-3">
        <div className="relative w-48 h-28 flex items-end justify-center">
          <svg
            viewBox="0 0 200 112"
            className="w-full h-full overflow-visible"
            role="img"
            aria-label={`${title}: ${clamped}%`}
          >
            <path
              d="M 28 96 A 72 72 0 0 1 172 96"
              fill="none"
              stroke="#E8EBEF"
              strokeWidth="20"
              strokeLinecap="butt"
            />
            <path
              d="M 28 96 A 72 72 0 0 1 172 96"
              fill="none"
              stroke="#C8102E"
              strokeWidth="20"
              strokeDasharray={`${filledLen} ${circumference}`}
              strokeLinecap="butt"
              className="transition-all duration-500"
            />
            <line x1="64" y1="33" x2="71" y2="44" stroke="#FFFFFF" strokeWidth="2.5" />
            <line x1="136" y1="33" x2="129" y2="44" stroke="#FFFFFF" strokeWidth="2.5" />
          </svg>
          <div className="absolute bottom-1 text-center">
            <p className="text-2xl font-extrabold font-mono text-slate-900 tabular-nums leading-none">
              {clamped}%
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
              {centerLabel}
            </p>
          </div>
        </div>
      </div>

      {legend.length > 0 && (
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          {legend.map((item, idx) => (
            <div key={item.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className="w-2 h-2 rounded-xs shrink-0"
                  style={{ backgroundColor: SINGLE_THEME_LEGEND_COLORS[idx % SINGLE_THEME_LEGEND_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="text-[10px] font-semibold text-slate-600 truncate">
                  {item.label}
                </span>
              </div>
              <p className="text-xs font-mono font-bold text-slate-900 tabular-nums mt-0.5">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export interface BarSeriesDatum {
  label: string;
  primary: number;
  secondary?: number;
}

export const CrimsonBarChart: React.FC<{
  title: string;
  subtitle?: string;
  primaryLabel: string;
  secondaryLabel?: string;
  data: BarSeriesDatum[];
}> = ({ title, subtitle, primaryLabel, secondaryLabel, data }) => {
  const maxVal = Math.max(
    1,
    ...data.map((d) => d.primary + (d.secondary ?? 0))
  );

  return (
    <div className="kpi-card p-5 flex flex-col justify-between h-full">
      <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-700">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#C8102E]" />
            {primaryLabel}
          </span>
          {secondaryLabel && (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#CBD0D8]" />
              {secondaryLabel}
            </span>
          )}
        </div>
      </div>

      <div className="pt-5 pb-1 flex-1 flex items-end gap-3 sm:gap-4 min-h-[168px]">
        {data.map((d) => {
          const total = d.primary + (d.secondary ?? 0);
          const pHeight = Math.round((d.primary / maxVal) * 116);
          const sHeight = Math.round(((d.secondary ?? 0) / maxVal) * 116);
          return (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5 min-w-0 group">
              <span className="text-[11px] font-mono font-bold text-slate-800 tabular-nums">
                {total}
              </span>
              <div className="w-full max-w-[34px] h-[120px] bg-slate-100 rounded-t-md flex flex-col justify-end overflow-hidden border border-slate-200/80">
                {secondaryLabel && (d.secondary ?? 0) > 0 && (
                  <div
                    style={{ height: `${Math.max(4, sHeight)}px` }}
                    className="w-full bg-[#CBD0D8] group-hover:bg-[#B4BBC6] transition-all duration-200"
                    title={`${d.label} — ${secondaryLabel}: ${d.secondary}`}
                  />
                )}
                {d.primary > 0 && (
                  <div
                    style={{ height: `${Math.max(4, pHeight)}px` }}
                    className="w-full bg-[#C8102E] group-hover:bg-[#A50D26] transition-all duration-200"
                    title={`${d.label} — ${primaryLabel}: ${d.primary}`}
                  />
                )}
              </div>
              <span className="text-[10px] font-semibold text-slate-600 text-center truncate w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

const SINGLE_THEME_DONUT_COLORS = ['#C8102E', '#94A3B8', '#E2E5EA'];

export const CrimsonDonutCard: React.FC<{
  title: string;
  subtitle?: string;
  centerValue: string | number;
  centerLabel: string;
  slices: DonutSlice[];
}> = ({ title, subtitle, centerValue, centerLabel, slices }) => {
  const total = Math.max(
    1,
    slices.reduce((sum, s) => sum + s.value, 0)
  );
  const r = 46;
  const circ = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="kpi-card p-5 flex flex-col justify-between h-full">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center justify-center py-3">
        <div className="relative w-36 h-36">
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full -rotate-90"
            role="img"
            aria-label={`${title}: ${centerValue} ${centerLabel}`}
          >
            <circle cx="60" cy="60" r={r} fill="none" stroke="#E8EBEF" strokeWidth="14" />
            {slices.map((sl, idx) => {
              const len = (sl.value / total) * circ;
              const dashOffset = -offset;
              offset += len;
              if (sl.value <= 0) return null;
              return (
                <circle
                  key={sl.label}
                  cx="60"
                  cy="60"
                  r={r}
                  fill="none"
                  stroke={SINGLE_THEME_DONUT_COLORS[idx % SINGLE_THEME_DONUT_COLORS.length]}
                  strokeWidth="14"
                  strokeDasharray={`${len} ${circ - len}`}
                  strokeDashoffset={dashOffset}
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5">
            <span className="text-xl font-extrabold font-mono text-slate-900 tabular-nums leading-none">
              {centerValue}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wide text-slate-600 mt-1 leading-tight">
              {centerLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-1.5 pt-3 border-t border-slate-100">
        {slices.map((sl, idx) => (
          <div key={sl.label} className="flex items-center justify-between gap-2 text-xs">
            <span className="inline-flex items-center gap-2 min-w-0 text-slate-700">
              <span
                className="w-2.5 h-2.5 rounded-xs shrink-0"
                style={{ backgroundColor: SINGLE_THEME_DONUT_COLORS[idx % SINGLE_THEME_DONUT_COLORS.length] }}
              />
              <span className="truncate">{sl.label}</span>
            </span>
            <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
              {sl.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CrimsonHorizontalBars: React.FC<{
  title: string;
  subtitle?: string;
  items: Array<{ label: string; value: number; total?: number; note?: string }>;
}> = ({ title, subtitle, items }) => {
  const max = Math.max(1, ...items.map((i) => i.total ?? i.value));

  return (
    <div className="kpi-card p-5 flex flex-col justify-between h-full">
      <div className="pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-[11px] text-slate-600 mt-0.5">{subtitle}</p>}
      </div>

      <div className="space-y-3.5 pt-4 flex-1 flex flex-col justify-center">
        {items.map((item) => {
          const denom = item.total ?? max;
          const pct = Math.max(4, Math.min(100, Math.round((item.value / Math.max(1, denom)) * 100)));
          return (
            <div key={item.label} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-slate-800 truncate">{item.label}</span>
                <span className="font-mono font-bold text-slate-900 tabular-nums shrink-0">
                  {item.value}
                  {item.note ? (
                    <span className="font-sans font-normal text-slate-600 ml-1">({item.note})</span>
                  ) : null}
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                <div
                  className="h-full rounded-full bg-[#C8102E] transition-all duration-300"
                  style={{ width: `${item.value === 0 ? 0 : pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const PageBannerHeader: React.FC<{
  eyebrow?: string;
  title: string;
  description: string;
  rightSlot?: React.ReactNode;
}> = ({ eyebrow, title, description, rightSlot }) => (
  <div className="kpi-card p-5 sm:p-6 border-l-4 border-l-[#C8102E] flex flex-wrap items-center justify-between gap-4">
    <div className="min-w-0">
      {eyebrow && (
        <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#C8102E] mb-1">
          {eyebrow}
        </p>
      )}
      <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
        {title}
      </h1>
      <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed max-w-3xl">
        {description}
      </p>
    </div>
    {rightSlot && <div className="shrink-0 w-full sm:w-auto">{rightSlot}</div>}
  </div>
);
