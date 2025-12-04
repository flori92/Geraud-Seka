'use client'

import Grid from '@mui/material/Grid2';
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
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <WeeklyOverview series={weeklyActivities} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TotalEarning totalRevenue={stats.totalRevenue} topOpportunities={topOpportunities} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Transactions stats={stats} />
        </Grid>
      </Grid>
    </MuiProvider>
  );
};

export default CrmDashboardTemplate;
