"use client"
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/router";
import React from "react";

function CreateInterview() {
  return (
    <div>
      <div className="flex gap-5 items-center  ">
        <ArrowLeft className="" />
        <h2 className="font-bold">Create New Interview</h2>
      </div>
    </div>
  )
}
export default CreateInterview
