import React from "react";

function QuestionListContainer({ questionList }) {
  return (
    <div>
      <h2 className='font-bold mb-2'>Generated Interview Questions</h2>
      <div className='p-5 border border-gray-200 rounded-xl bg-white'>
        {questionList.map((item, index) => (
          <div key={index} className='p-3 border border-gray-300 rounded-xl m-2'>
            <h2 className='font-medium'>{item.question}</h2>
            <h2 className='text-primary'>Item : {item?.type}</h2>
          </div>
        ))}
      </div>
    </div>

  )
}

export default QuestionListContainer
