import { useState } from 'react';
import { useProfile } from '../../hooks/useProfile';
import { useEmissions } from '../../hooks/useEmissions';
import { ImpactPlan } from './ImpactPlan';
import { AIChatPanel } from './AIChatPanel';

type Tab = 'ai' | 'plan';

export function Coach() {
  const { profile } = useProfile();
  const { footprint } = useEmissions();
  const [activeTab, setActiveTab] = useState<Tab>('ai');

  if (!profile || !footprint) {
    return (
      <div className="text-center py-20 text-slate-500 dark:text-slate-400">
        Please complete onboarding first to see your personalized plan.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <section aria-labelledby="coach-title" className="text-center sm:text-left">
        <h2 id="coach-title" className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Your Carbon Coach
        </h2>
        <p className="text-slate-600 dark:text-slate-400 text-lg">
          Get personalized AI advice or view your prioritized impact plan.
        </p>
      </section>

      {/* Custom Tabs */}
      <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl inline-flex w-full sm:w-auto" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'ai'}
          onClick={() => setActiveTab('ai')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'ai'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🤖 AI Coach
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'plan'}
          onClick={() => setActiveTab('plan')}
          className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
            activeTab === 'plan'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          🎯 Impact Plan
        </button>
      </div>

      <div role="tabpanel" className="mt-6 min-h-[600px]">
        {activeTab === 'ai' ? <AIChatPanel /> : <ImpactPlan />}
      </div>
    </div>
  );
}
