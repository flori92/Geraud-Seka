'use client'

import WeeklyOverview from './WeeklyOverview';
import TotalEarning, { TopOpportunity } from './TotalEarning';
import Transactions from './Transactions';
import MuiProvider from './MuiProvider';

interface CrmDashboardProps {
  stats: {
    totalLeads: number;
    wonOpportunities: number;
    openOpportunities: number;
    totalRevenue: number;
  };
  weeklyActivities: number[];
  topOpportunities: TopOpportunity[];
}

const CrmDashboardTemplate = ({ stats, weeklyActivities, topOpportunities }: CrmDashboardProps) => {
  return (
    <MuiProvider>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <WeeklyOverview series={weeklyActivities} />
        </div>
        <div className="lg:col-span-1">
          <TotalEarning totalRevenue={stats.totalRevenue} topOpportunities={topOpportunities} />
        </div>
        <div className="lg:col-span-1">
          <Transactions stats={stats} />
        </div>
      </div>
    </MuiProvider>
  );
};

export default CrmDashboardTemplate;
