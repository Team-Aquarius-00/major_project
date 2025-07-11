"use client"
import React, { useContext } from "react"
import { InterviewDataContext } from "../../../../context/InterviewDataContext"
import { Mic, Phone, Timer } from "lucide-react"
import Image from "next/image"
function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext)
  return (
    <div className="p-20 lg:px48 xl:px-56">
      <h2 className="font-bold flex justify-between text-xl">Ai Interview session
        <span className="flex gap-2 items-center">
          <Timer />00:00:00
        </span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 mt-5">
        <div className="bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center p-10 ">
          <Image src={'/ai.png'} alt="aI image" width={300}
            height={300}
            className="rounded-full object-cover h-[200px] w-[200px] items-center justify-between ml-10"
          />
          <h2 className="font-bold mt-4 items-center text-center">Ai recruiter</h2>
        </div>
        <div className="bg-white h-[400px] rounded-lg border flex flex-col gap-3 items-center p-10 ">
          {/* <Image src={'/ai.png'} alt="aI image" width={300} */}
          {/*   height={300} */}
          {/*   className="rounded-full object-cover h-[200px] w-[200px] items-center justify-between ml-10" */}
          {/* /> */}
          <h2 className="bg-white rounded-full px-5 font-bold mt-4 text-lg">{interviewInfo?.userName[0]}</h2>
          <h2>{interviewInfo?.userName || 'Sainth Joseph'} </h2>
        </div>
      </div>

      <div className="flex flex-col ">
        <div className=" flex flex-row gap-2 items-center justify-center w-full mt-5">

          <Mic className="h-12 w-12 rounded-full p-3 bg-gray-200 cursor-pointer " />
          <Phone
            className="h-12 w-12 rounded-full p-3 bg-red-500 text-black cursor-pointer"
          />
        </div>
        <div className="items-center justify-center  flex ">
          <h2 className="mt-5 text-gray-400 items-center ">Interview is in progress</h2>
        </div>
      </div>

    </div>
  )
}

export default StartInterview
