import { Phone, Video } from "lucide-react";
import Link from "next/link";
import React from "react";

function CreateOptions() {
  return (
    <div className="grid grid-cols-2 gap-5">
      <Link href={"/dashboard/create-interview"} className="bg-white border border-r-gray-200 rounded-lg p-5">
        <Video className="p-3 text-primary bg-blue-50 rounded-lg h-12 w-12" />
        <h2 className="font-bold">Create New Interview </h2>
        <p className="text-gray-500">Create AI interviews and schedule with the candidates</p>
      </Link>
      <div className="bg-white border border-r-gray-200 rounded-lg p-5">
        <Phone className="p-3 text-primary bg-blue-50 rounded-lg h-12 w-12" />
        <h2 className="font-bold">Create Phone Screening </h2>
        <p className="text-gray-500">Create phone screening with candidates</p>
      </div>
    </div>
  )
}

export default CreateOptions
