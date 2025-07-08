import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QuestionlistContainer from './QuestionListContainer'
import { supabase } from '@/services/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { useUser } from '@/app/Provider'

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true)
  const [questionList, setQuestionList] = useState()
  const [saveLoading, setSaveLoading] = useState(false)
  const { user } = useUser()
  console.log('Hello from question list')
  useEffect(() => {
    if (
      formData &&
      formData.jobPosition &&
      formData.jobDescription &&
      formData.duration &&
      formData.type
    ) {
      // GenerateQuestionList()
    }
  }, [formData])

  const onFinish = async () => {
    setSaveLoading(true)
    const interview_id = uuidv4()
    const { data, error } = await supabase
      .from('Interview')
      .insert([
        {
          ...formData,
          questionList: questionList,
          userEmail: user?.email,
          interview_id: interview_id,
        },
      ])
      .select()
    setSaveLoading(false)
    console.log(data)
    onCreateLink(interview_id)
  }
  const GenerateQuestionList = async () => {
    setLoading(true)
    try {
      const result = await axios.post('/api/ai-model', { ...formData })
      const Content = result.data.content

      const contentMatch = Content.match(/```json([\s\S]*?)```/)
      if (!contentMatch)
        throw new Error('Invalid format: JSON block not found.')

      const FINAL_CONTENT = contentMatch[1].trim()
      console.log(FINAL_CONTENT)

      setQuestionList(JSON.parse(FINAL_CONTENT)?.interviewQuestions)
      console.log(JSON.parse(FINAL_CONTENT)?.interviewQuestions)

      setLoading(false)
    } catch (error) {
      console.log(error)
      toast('server error , try again')
      setLoading(false)
    }
  }

  return (
    <div>
      {loading && (
        <div className='p-5 bg-blue-50 rounded-xl border border-gray-100 flex gap-5 items-center'>
          <Loader2Icon className='animate-spin' />
          <div>
            <h2>Generating Interview Questions</h2>
            <p>Our AI is creating personalized questions </p>
          </div>
        </div>
      )}

      {questionList?.length > 0 && (
        <div>
          <QuestionlistContainer questionList={questionList} />
        </div>
      )}
      <div className='flex justify-end mt-5'>
        <Button className='' onClick={() => onFinish()} disabled={saveLoading}>
          {saveLoading && <Loader2 className='animate-spin' />}
          Create Interview Link and Finish
        </Button>
      </div>
    </div>
  )
}
export default QuestionList
