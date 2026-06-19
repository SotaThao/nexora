import React from 'react';
import { Sparkles } from 'lucide-react';
import { useTranslation } from '../../../contexts/LanguageContext';

export default function TipsPayoutsTab() {
  const { t } = useTranslation();

  return (
    <div className="card-elevated flex min-h-[400px] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-nexoraBorder dark:border-white/10 bg-white dark:bg-luxuryCoal text-nexoraBrand dark:text-luxuryGold">
          <Sparkles className="h-9 w-9" />
        </div>
        <h2 className="mt-5 text-xl font-black text-inkBlue dark:text-white tracking-tight">
          {t('coming_soon.default_title')}
        </h2>
        <p className="mt-2 text-sm text-mutedGrey dark:text-slate-400">
          {t('coming_soon.default_desc')}
        </p>
      </div>
    </div>
  );
}
