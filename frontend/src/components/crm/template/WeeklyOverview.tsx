'use client'

import dynamic from 'next/dynamic'

import Card from '@mui/material/Card'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import IconButton from '@mui/material/IconButton'
import MoreVertIcon from '@mui/icons-material/MoreVert'

import type { ApexOptions } from 'apexcharts'

const ReactApexCharts = dynamic(() => import('react-apexcharts'), { ssr: false })

interface WeeklyOverviewProps {
  series: number[];
  percentageGrowth?: number;
}

const WeeklyOverview = ({ series, percentageGrowth = 0 }: WeeklyOverviewProps) => {
  const theme = useTheme()

  const options: ApexOptions = {
    chart: {
      parentHeightOffset: 0,
      toolbar: { show: false }
    },
    plotOptions: {
      bar: {
        borderRadius: 7,
        distributed: true,
        columnWidth: '40%'
      }
    },
    stroke: {
      width: 2,
      colors: [theme.palette.background.paper]
    },
    legend: { show: false },
    grid: {
      xaxis: { lines: { show: false } },
      strokeDashArray: 7,
      padding: { left: -9, top: -20, bottom: 13 },
      borderColor: theme.palette.divider
    },
    dataLabels: { enabled: false },
    colors: [
      theme.palette.action.selected,
      theme.palette.action.selected,
      theme.palette.action.selected,
      theme.palette.primary.main,
      theme.palette.action.selected,
      theme.palette.action.selected,
      theme.palette.action.selected
    ],
    states: {
      hover: {
        filter: { type: 'none' }
      },
      active: {
        filter: { type: 'none' }
      }
    },
    xaxis: {
      categories: ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
      tickPlacement: 'on',
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false }
    },
    yaxis: {
      show: true,
      tickAmount: 4,
      labels: {
        offsetY: 2,
        offsetX: -17,
        style: { colors: theme.palette.text.disabled, fontSize: theme.typography.body2.fontSize as string },
        formatter: value => `${value > 999 ? `${(value / 1000).toFixed(0)}` : value}k`
      }
    }
  }

  return (
    <Card>
      <CardHeader
        title='Activité Hebdomadaire'
        action={
          <IconButton aria-label="settings">
            <MoreVertIcon />
          </IconButton>
        }
      />
      <CardContent sx={{ '& .apexcharts-xcrosshairs.apexcharts-active': { opacity: 0 } }}>
        <ReactApexCharts
          type='bar'
          height={206}
          width='100%'
          series={[{ name: 'Activités', data: series.length > 0 ? series : [0, 0, 0, 0, 0, 0, 0] }]}
          options={options}
        />
        <div className='flex items-center mb-4 gap-4'>
          <Typography variant='h4'>{percentageGrowth > 0 ? `+${percentageGrowth}%` : `${percentageGrowth}%`}</Typography>
          <Typography>
            Votre activité est {percentageGrowth >= 0 ? 'en hausse 😎' : 'en baisse 📉'} par rapport à la semaine dernière
          </Typography>
        </div>
        <Button fullWidth variant='contained'>
          Détails
        </Button>
      </CardContent>
    </Card>
  )
}

export default WeeklyOverview
