'use client'

import Grid from '@mui/material/Grid2';
import WeeklyOverview from './WeeklyOverview';
import TotalEarning from './TotalEarning';
import Transactions from './Transactions';
import MuiProvider from './MuiProvider';

const CrmDashboardTemplate = () => {
  return (
    <MuiProvider>
      <Grid container spacing={6}>
        <Grid size={{ xs: 12, md: 4 }}>
          <WeeklyOverview />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <TotalEarning />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Transactions />
        </Grid>
      </Grid>
    </MuiProvider>
  );
};

export default CrmDashboardTemplate;
