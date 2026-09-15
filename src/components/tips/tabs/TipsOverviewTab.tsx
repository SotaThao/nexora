import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, ArrowUpRight, TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';
import { formatUSD } from '../../../utils/tipsFormatters';
import TipsTrendChart from '../../dashboard/charts/TipsTrendChart';
import IncomeByCategoryPanel from '../../dashboard/charts/IncomeByCategoryPanel';
import { buildDashboardMenuPath, DASHBOARD_MENU_ID } from '../../dashboard/constants';

export function isLeadingOddCard(itemCount: number, index: number) {
  return itemCount % 2 === 1 && index === 0;
}

export default function TipsOverviewTab({
  totalVolume,
  directTips,
  cardTips,
  cryptoTips,
  svgMetrics,
  yTicks,
  chartBars,
  chartRef,
  hoverIndex,
  setHoverIndex,
  activePoint,
  donutSegments,
  donutTotal,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const hasCrypto = cryptoTips > 0;
  const overviewCards = [
    {
      id: 'total',
      label: t('dashboard.tips.kpi.total_revenue'),
      value: totalVolume,
      icon: DollarSign,
      iconClass: 'bg-luxuryGold/10 text-luxuryGold',
    },
    {
      id: 'direct',
      label: t('dashboard.tips.kpi.direct_p2p'),
      value: directTips,
      icon: ArrowUpRight,
      iconClass: 'bg-brandCyan/10 text-brandCyan',
    },
    {
      id: 'card',
      label: t('dashboard.tips.kpi.card_tips'),
      value: cardTips,
      icon: DollarSign,
      iconClass: 'bg-slate-100 text-mutedGrey dark:bg-white/5',
    },
    ...(hasCrypto
      ? [
          {
            id: 'crypto',
            label: t('dashboard.tips.kpi.crypto_tips'),
            value: cryptoTips,
            icon: TrendingUp,
            iconClass: 'bg-amber-100 text-amber-500 dark:bg-amber-500/10',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards Grid */}
      <div
        data-testid="tips-kpi-grid"
        className={`grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-3 ${
          hasCrypto ? 'xl:grid-cols-4' : ''
        }`}
      >
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          const spansMobileRow = isLeadingOddCard(overviewCards.length, index);

          return (
            <div
              key={card.id}
              data-testid={`tips-kpi-${card.id}`}
              className={`card-elevated flex items-center justify-between gap-2 p-3 sm:p-6 ${
                spansMobileRow ? 'col-span-2 lg:col-span-1' : ''
              }`.trim()}
            >
              <div className="min-w-0">
                <small className="text-[10px] font-black text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
                  {card.label}
                </small>
                <h3 className="mt-1 text-lg font-black text-inkBlue dark:text-white sm:text-2xl">
                  {formatUSD(card.value)}
                </h3>
              </div>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:h-10 sm:w-10 ${card.iconClass}`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Summary Chart — full width */}
      <div className="card-elevated">
        <h4 className="mb-6 text-sm font-black uppercase tracking-wider text-inkBlue dark:text-white">
          {t('dashboard.tips.charts.weekly_title')}
        </h4>

        <TipsTrendChart
          svgMetrics={svgMetrics}
          yTicks={yTicks}
          chartBars={chartBars}
          chartRef={chartRef}
          hoverIndex={hoverIndex}
          setHoverIndex={setHoverIndex}
          activePoint={activePoint}
        />
      </div>

      {/* Income by category + Payment Method Split */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <IncomeByCategoryPanel
            scope="merchant"
            onManageCategories={() => navigate(buildDashboardMenuPath(DASHBOARD_MENU_ID.categoryManagement))}
          />
        </div>

        <div className="card-elevated lg:col-span-2 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-inkBlue dark:text-white uppercase tracking-wider mb-6">
              {t('dashboard.tips.charts.method_split')}
            </h4>

            {/* Custom SVG Donut Chart */}
            <div className="relative flex justify-center py-4">
              <svg width="160" height="160" viewBox="0 0 160 160" className="-rotate-90">
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#f1f5f9" strokeWidth="18" />
                {donutSegments.map((seg) => {
                  const radius = 60;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDasharray = `${(seg.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((seg.startAngle / 360) * circumference);
                  return (
                    <circle
                      key={seg.name}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="transparent"
                      stroke={seg.color}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-mutedGrey dark:text-slate-400 uppercase tracking-widest">
                  {t('dashboard.tips.kpi.total_tips_circle')}
                </span>
                <span className="text-lg font-black text-inkBlue dark:text-white mt-0.5">{formatUSD(donutTotal)}</span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs font-bold">
            {donutSegments.map(seg => (
              <div key={seg.name} className="flex items-center gap-1.5 text-mutedGrey dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
                <span>{seg.name}: {seg.percentage.toFixed(0)}% ({formatUSD(seg.value)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
