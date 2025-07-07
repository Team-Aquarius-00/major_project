import React, { useEffect, useState } from "react";
import axios from 'axios'
import { toast } from "sonner";
import { Loader2Icon } from "lucide-react";

function QuestionList({ formData }) {
  const [loading, setLoading] = useState(true)
  console.log("Hello from question list")
  useEffect(() => {
    if (formData) {
      GenerateQuestionList()
    }
  }, [formData])

  const GenerateQuestionList = async () => {
    setLoading(true)
    try {

      const result = await axios.post('/api/ai-model', { ...formData })
      console.log(result.data)
      setLoading(false)
    } catch (error) {
      console.log(error)
      toast('server error , try again')
      setLoading(false)

    }

  }
  return (
    <div >
      {loading && <div className="p-5 bg-blue-50 rounded-xl border border-gray-100 flex gap-5 items-center">
        <Loader2Icon className="animate-spin" />
        <div>
          <h2>Generating Interview Questions</h2>
          <p>Our AI is creating personalized questions </p>
        </div>
      </div>}
    </div>
  )
}
export default QuestionList
