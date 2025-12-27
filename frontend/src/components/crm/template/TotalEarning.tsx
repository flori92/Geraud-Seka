'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'

import { Smartphone, Layers, Code, DollarSign, Briefcase } from 'lucide-react'

type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

export interface TopOpportunity {
  id: string
  title: string
  subtitle: string
  amount: string
  progress: number
  color?: ThemeColor
  icon?: any
}

interface TotalEarningProps {
  totalRevenue: number
  topOpportunities: TopOpportunity[]
}

const TotalEarning = ({ totalRevenue, topOpportunities }: TotalEarningProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value)
  }

  return (
    <Card>
      <CardHeader
        title='Revenus Commerciaux'
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='h4'>{formatCurrency(totalRevenue)}</Typography>
            <ArrowDropUpIcon color="success" />
            <Typography component='span' color='success.main'>
              10%
            </Typography>
          </div>
          <Typography variant="body2" color="text.secondary">Revenu potentiel des opportunités gagnées</Typography>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {topOpportunities.length > 0 ? (
            topOpportunities.map((item, index) => {
              const Icon = item.icon || Briefcase
              return (
                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar variant='rounded' sx={{ bgcolor: 'action.hover', width: 40, height: 40 }}>
                     <Icon size={24} color="#666" /> 
                  </Avatar>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="caption">{item.subtitle}</Typography>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                      <Typography color='text.primary' sx={{ fontWeight: 500 }}>
                        {item.amount}
                      </Typography>
                      <LinearProgress
                        variant='determinate'
                        value={item.progress}
                        color={item.color || 'primary'}
                        sx={{ width: 100, height: 6, borderRadius: 5 }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <Typography variant="body2" color="text.secondary" align="center">Aucune opportunité récente</Typography>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalEarning
