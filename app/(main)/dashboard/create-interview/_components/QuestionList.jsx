import React, { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { toast } from 'sonner'
import { Loader2, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QuestionlistContainer from './QuestionListContainer'
import { supabase } from '@/services/supabaseClient'
import { v4 as uuidv4 } from 'uuid'
import { useUser as useClerkUser } from '@clerk/nextjs'

function QuestionList({ formData, onCreateLink }) {
  const [loading, setLoading] = useState(true)
  const [questionList, setQuestionList] = useState()
  const [saveLoading, setSaveLoading] = useState(false)
  const { user: clerkUser } = useClerkUser()
  console.log('Hello from question list')

  const GenerateQuestionList = useCallback(async () => {
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
  }, [formData])

  useEffect(() => {
    if (
      formData &&
      formData.jobPosition &&
      formData.jobDescription &&
      formData.duration &&
      formData.type
    ) {
      GenerateQuestionList()
    }
  }, [formData, GenerateQuestionList])

  const onFinish = async () => {
    setSaveLoading(true)
    const interview_id = uuidv4()
    try {
      // Map camelCase formData to snake_case DB columns to match Postgres schema
      const insertObj = {
        interview_id: interview_id,
        job_position: formData.jobPosition,
        job_description: formData.jobDescription,
        duration: formData.duration,
        type: formData.type,
        questionList: questionList,
        userEmail:
          clerkUser?.primaryEmailAddress?.emailAddress ||
          clerkUser?.emailAddresses?.[0]?.emailAddress,
      }

      const { data, error } = await supabase
        .from('Interview')
        .insert([insertObj])
        .select()

      setSaveLoading(false)

      if (error) {
        console.error('Supabase insert error:', error)
        // Helpful hint if table missing or permission denied
        const msg = String(error.message || error)
        if (
          msg.toLowerCase().includes('relation') ||
          msg.toLowerCase().includes('does not exist') ||
          msg.toLowerCase().includes('no such table')
        ) {
          toast('Database table missing. Create `Interviews` table in your DB.')
        } else if (
          msg.toLowerCase().includes('permission') ||
          msg.toLowerCase().includes('policy')
        ) {
          toast('Permission denied. Check Supabase RLS/policies and API keys.')
        } else {
          toast('Failed to save interview: ' + msg)
        }
        return
      }

      if (!data || data.length === 0) {
        toast('No data returned after saving. Check DB.')
        return
      }

      console.log('Saved interview:', data)
      onCreateLink(interview_id)
    } catch (e) {
      setSaveLoading(false)
      console.error('Unexpected error saving interview:', e)
      toast('Unexpected error saving interview. See console for details.')
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
