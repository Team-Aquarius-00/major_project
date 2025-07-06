import { BriefcaseBusinessIcon, Calendar, Code2Icon, Gem, LayoutDashboard, List, Puzzle, Settings, User2Icon, WalletCards } from "lucide-react"
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

export const InterviewType = [
  {
    title: 'Technical',
    icon: Code2Icon
  },

  {
    title: 'Behavioral',
    icon: User2Icon
  },

  {
    title: 'Experience',
    icon: BriefcaseBusinessIcon
  },

  {
    title: 'Problem Solving',
    icon: Puzzle
  },

  {
    title: 'Leadership',
    icon: Gem
  },


]
