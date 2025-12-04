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

type DataType = {
  icon: any
  stats: string
  title: string
  color: ThemeColor
}

// Vars
const data: DataType[] = [
  {
    stats: '245k',
    title: 'Ventes',
    color: 'primary',
    icon: PieChart
  },
  {
    stats: '12.5k',
    title: 'Clients',
    color: 'success',
    icon: Users
  },
  {
    stats: '1.54k',
    title: 'Produits',
    color: 'warning',
    icon: Laptop
  },
  {
    stats: '$88k',
    title: 'Revenus',
    color: 'info',
    icon: DollarSign
  }
]

const Transactions = () => {
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
            <span style={{ fontWeight: 600 }}>Total 48.5% Croissance 😎</span>
            <span style={{ color: 'text.secondary' }}> ce mois</span>
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
                    <Typography variant="body2">{item.title}</Typography>
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
