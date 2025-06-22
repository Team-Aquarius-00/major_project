import Image from "next/image"

const page = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="">
        <Image src={'/logo.png'} alt="" />
      </div>
    </div>
  )
}

export default page
