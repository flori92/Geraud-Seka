'use client'

// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Avatar from '@mui/material/Avatar'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp'

// Icons
import { Smartphone, Layers, Code } from 'lucide-react'

// Types
type ThemeColor = 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'

type DataType = {
  title: string
  icon: any
  amount: string
  progress: number
  subtitle: string
  color?: ThemeColor
}

const data: DataType[] = [
  {
    progress: 75,
    title: 'Zipcar',
    amount: '$24,895.65',
    subtitle: 'Vuejs, React & HTML',
    icon: Code,
    color: 'primary'
  },
  {
    progress: 50,
    color: 'info',
    title: 'Bitbank',
    amount: '$8,650.20',
    subtitle: 'Sketch, Figma & XD',
    icon: Layers
  },
  {
    progress: 20,
    title: 'Aviato',
    color: 'secondary',
    amount: '$1,245.80',
    subtitle: 'HTML & Angular',
    icon: Smartphone
  }
]

const TotalEarning = () => {
  return (
    <Card>
      <CardHeader
        title='Revenus Totaux'
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant='h4'>$24,895</Typography>
            <ArrowDropUpIcon color="success" />
            <Typography component='span' color='success.main'>
              10%
            </Typography>
          </div>
          <Typography variant="body2" color="text.secondary">Comparé à $84,325 l'an dernier</Typography>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data.map((item, index) => {
            const Icon = item.icon
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
                      color={item.color}
                      sx={{ width: 100, height: 6, borderRadius: 5 }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalEarning
