import { Calendar, LayoutDashboard, List, Settings, WalletCards } from "lucide-react"
export const SideBarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard'
  }
  ,

  {
    name: 'Schedule Interview',
    icon: Calendar,
    path: '/schedule-interview'
  }
  ,

  {
    name: 'All Interview',
    icon: List,
    path: '/all-interview'
  }
  ,
  {
    name: 'Billings',
    icon: WalletCards,
    path: '/billings'
  }
  ,
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings'
  }
  ,
]
