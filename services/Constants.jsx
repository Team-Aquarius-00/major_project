import {
  BriefcaseBusinessIcon,
  Calendar,
  Code2Icon,
  Gem,
  Trophy,
  LayoutDashboard,
  List,
  Puzzle,
  Settings,
  User2Icon,
  WalletCards,
} from 'lucide-react'
export const SideBarOptions = [
  {
    name: 'Dashboard',
    icon: LayoutDashboard,
    path: '/dashboard',
    section: 'Main',
  },
  {
    name: 'Schedule Interview',
    icon: Calendar,
    path: '/schedule-interview',
    section: 'Interviews',
    // badge: 4,
  },
  {
    name: 'All Interview',
    icon: List,
    path: '/all-interview',
    section: 'Interviews',
    // badge: 2,
  },
  {
    name: 'Interview Result',
    icon: Trophy,
    path: '/dashboard/InterviewResult',
    section: 'Interviews',
  },
  {
    name: 'Billings',
    icon: WalletCards,
    path: '/billings',
    section: 'Account',
  },
  {
    name: 'Settings',
    icon: Settings,
    path: '/settings',
    section: 'Account',
  },
]

export const InterviewType = [
  {
    title: 'Technical',
    icon: Code2Icon,
  },

  {
    title: 'Behavioral',
    icon: User2Icon,
  },

  {
    title: 'Experience',
    icon: BriefcaseBusinessIcon,
  },

  {
    title: 'Problem Solving',
    icon: Puzzle,
  },

  {
    title: 'Leadership',
    icon: Gem,
  },
]

export const QUESTIONS_PROMPT = `You are an expert technical interviewer.
Based on the following inputs, generate a well-structured list of high-quality interview questions:
Job Title: {{jobTitle}}
Job Description:{{jobDescription}}
Interview Duration:{{duration}}
Interview Type :{{type}}

Your task:
Analyze the job description to identify the key responsibilites , required skills and expected Experience.
Generate a list of interview questions depends on interview duration.
Ensure the questions match the tone and structure of a real-life {{type}} interview.
Format your response in JSON format with array list of questions.
format: interviewQuestions=[
{
question:'',
type:'{{type}}'
},
{
...
}]
The goal is to create a structured, relevant and time optimized interview plan for {{jobTitle}} role
`
