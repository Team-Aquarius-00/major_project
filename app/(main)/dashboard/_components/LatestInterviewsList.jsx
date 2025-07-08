"use client"
import { Camera, Plus } from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";
function LatestInterviesList() {
  const router = useRouter()
  const handleClick = () => {
    router.push('/dashboard/create-interview')
  }
  const [interviewList, setInterviewList] = useState([])
  return (
    <div className="my-5">
      <h2 className="font-bold">Previously Created Interviews</h2>
      {interviewList?.length == 0 &&
        <div className="p-5 flex flex-col items-center gap-3 bg-white">
          <Camera className="h-10 w-10 text-primary" />
          <h2>You don't have any interview created</h2>
          <Button onClick={handleClick}><Plus /> Create New Interview</Button>
        </div>}
    </div>
  )
}

export default LatestInterviesList
