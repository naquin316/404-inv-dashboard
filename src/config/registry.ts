import { Scissors, AlertTriangle, BarChart3 } from 'lucide-react'
import { FlowCutsTab } from '../components/dashboard/FlowCutsTab'
import { FinalShortsTab } from '../components/dashboard/FinalShortsTab'
import { loadFlowCuts, loadShorts } from '../data/loaders'
import type { WorkbookDefinition } from '../types'

export const workbookRegistry: WorkbookDefinition[] = [
  {
    id: 'inventory-404',
    label: 'HEB 404',
    icon: BarChart3,
    pages: [
      {
        id: 'fc',
        label: 'Flow Cuts',
        icon: Scissors,
        sheet: 'Flow Cuts',
        component: FlowCutsTab,
        dataLoader: loadFlowCuts,
      },
      {
        id: 'sh',
        label: 'Final Shorts',
        icon: AlertTriangle,
        sheet: 'Final Short Tracker',
        component: FinalShortsTab,
        dataLoader: loadShorts,
      },
    ],
  },
]
