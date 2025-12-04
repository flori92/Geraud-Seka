'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid2'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

// Icons
import { PieChart, Users, Laptop, DollarSign } from 'lucide-react'

// Types
type ThemeColor = 'primary' | 'success' | 'warning' | 'info' | 'secondary' | 'error'

interface TransactionsProps {
  stats: {
    wonOpportunities: number;
    totalLeads: number;
    openOpportunities: number;
    totalRevenue: number;
  }
}

const Transactions = ({ stats }: TransactionsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('fr-FR').format(value);
  }

  const data = [
    {
      stats: formatNumber(stats.wonOpportunities),
      title: 'Ventes Gagnées',
      color: 'primary' as ThemeColor,
      icon: PieChart
    },
    {
      stats: formatNumber(stats.totalLeads),
      title: 'Total Leads',
      color: 'success' as ThemeColor,
      icon: Users
    },
    {
      stats: formatNumber(stats.openOpportunities),
      title: 'Opportunités',
      color: 'warning' as ThemeColor,
      icon: Laptop
    },
    {
      stats: formatCurrency(stats.totalRevenue),
      title: 'Revenus',
      color: 'info' as ThemeColor,
      icon: DollarSign
    }
  ]

  const getColorStyle = (color: ThemeColor) => {
    switch (color) {
      case 'primary': return { bgcolor: 'primary.main', color: 'primary.contrastText' }
      case 'success': return { bgcolor: 'success.main', color: 'success.contrastText' }
      case 'warning': return { bgcolor: 'warning.main', color: 'warning.contrastText' }
      case 'info': return { bgcolor: 'info.main', color: 'info.contrastText' }
      case 'secondary': return { bgcolor: 'secondary.main', color: 'secondary.contrastText' }
      case 'error': return { bgcolor: 'error.main', color: 'error.contrastText' }
      default: return { bgcolor: 'primary.main', color: 'primary.contrastText' }
    }
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title='Transactions'
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
        subheader={
          <Typography variant="body2" sx={{ mb: 2 }}>
            <span style={{ fontWeight: 600 }}>Vue d'ensemble</span>
            <span style={{ color: 'text.secondary' }}> performance commerciale</span>
          </Typography>
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <Grid container spacing={2}>
          {data.map((item, index) => {
            const Icon = item.icon
            return (
              <Grid key={index} size={{ xs: 6, md: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar variant='rounded' sx={{ ...getColorStyle(item.color), width: 44, height: 44, boxShadow: 1 }}>
                    <Icon size={24} />
                  </Avatar>
                  <div>
                    <Typography variant="body2" noWrap>{item.title}</Typography>
                    <Typography variant='h6'>{item.stats}</Typography>
                  </div>
                </div>
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}

export default Transactions
