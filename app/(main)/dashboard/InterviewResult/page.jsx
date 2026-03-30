'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@/app/provider'

function InterviewResultPage() {
  const { user } = useUser()
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [queryInterviewId, setQueryInterviewId] = useState('')
  const [jobPositions, setJobPositions] = useState([])
  const [selectedJobPosition, setSelectedJobPosition] = useState('')
  const [isPositionsLoading, setIsPositionsLoading] = useState(true)
  const [onlySuspicious, setOnlySuspicious] = useState(false)

  const loadJobPositions = async (email) => {
    try {
      setIsPositionsLoading(true)

      const url = email
        ? `/api/interview?userEmail=${encodeURIComponent(email)}`
        : '/api/interview'
      const response = await fetch(url, { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to fetch job positions')
      }

      const interviews = Array.isArray(payload.data) ? payload.data : []
      const grouped = interviews.reduce((acc, interview) => {
        const position = String(interview?.job_position || '').trim()
        if (!position) return acc

        if (!acc[position]) {
          acc[position] = {
            job_position: position,
            interview_ids: new Set(),
          }
        }

        if (interview?.interview_id) {
          acc[position].interview_ids.add(interview.interview_id)
        }

        return acc
      }, {})

      const positions = Object.values(grouped).map((item) => ({
        job_position: item.job_position,
        interview_count: item.interview_ids.size,
      }))

      positions.sort((a, b) => a.job_position.localeCompare(b.job_position))
      setJobPositions(positions)
    } catch (fetchError) {
      setJobPositions([])
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load job positions',
      )
    } finally {
      setIsPositionsLoading(false)
    }
  }

  const loadResults = async ({
    interviewId = '',
    jobPosition = '',
    email = '',
  }) => {
    try {
      setIsLoading(true)
      setError('')

      const params = new URLSearchParams()
      if (interviewId) params.set('interview_id', interviewId)
      if (jobPosition) params.set('job_position', jobPosition)
      if (email) params.set('userEmail', email)
      const query = params.toString()
      const url = query
        ? `/api/interview-attempt/results?${query}`
        : '/api/interview-attempt/results'

      const response = await fetch(url, { cache: 'no-store' })
      const payload = await response.json()

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Failed to fetch interview results')
      }

      setRows(Array.isArray(payload.data) ? payload.data : [])
    } catch (fetchError) {
      setRows([])
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to load interview results',
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.email) {
      setJobPositions([])
      setRows([])
      setIsPositionsLoading(false)
      setIsLoading(false)
      return
    }

    loadJobPositions(user.email)
  }, [user?.email])

  const displayedRows = useMemo(() => {
    if (!onlySuspicious) return rows

    return rows.filter(
      (item) =>
        Array.isArray(item?.detection_snapshot_urls) &&
        item.detection_snapshot_urls.length > 0,
    )
  }, [rows, onlySuspicious])

  const computedAverage = useMemo(() => {
    if (!displayedRows.length) return null

    const finalScores = displayedRows
      .map((item) => Number(item?.final_score))
      .filter((value) => Number.isFinite(value))

    if (!finalScores.length) return null

    const avg =
      finalScores.reduce((sum, value) => sum + value, 0) / finalScores.length
    return Math.round(avg)
  }, [displayedRows])

  const onSearch = (event) => {
    event.preventDefault()
    if (!selectedJobPosition || !user?.email) return

    loadResults({
      interviewId: queryInterviewId.trim(),
      jobPosition: selectedJobPosition,
      email: user.email,
    })
  }

  return (
    <div className='space-y-5'>
      <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <h1 className='text-2xl font-bold text-slate-900'>Interview Results</h1>
        <p className='mt-1 text-sm text-slate-600'>
          Select a job position to view the results flow for that position.
        </p>

        {isPositionsLoading ? (
          <p className='mt-4 text-sm text-slate-500'>
            Loading job positions...
          </p>
        ) : jobPositions.length === 0 ? (
          <p className='mt-4 text-sm text-slate-500'>
            No job positions found for your account.
          </p>
        ) : (
          <div className='mt-4 flex flex-wrap gap-2'>
            {jobPositions.map((item) => (
              <button
                key={item.job_position}
                type='button'
                onClick={() => {
                  setSelectedJobPosition(item.job_position)
                  setQueryInterviewId('')
                  if (user?.email) {
                    loadResults({
                      jobPosition: item.job_position,
                      email: user.email,
                    })
                  }
                }}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  selectedJobPosition === item.job_position
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                {item.job_position} ({item.interview_count})
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={onSearch}
          className='mt-4 flex flex-col gap-3 sm:flex-row'
        >
          <input
            type='text'
            value={queryInterviewId}
            onChange={(event) => setQueryInterviewId(event.target.value)}
            placeholder='Filter selected flow by Interview ID'
            disabled={!selectedJobPosition}
            className='h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-sky-500/20 transition focus:ring disabled:cursor-not-allowed disabled:bg-slate-100'
          />
          <button
            type='submit'
            disabled={!selectedJobPosition}
            className='h-10 rounded-lg bg-sky-600 px-4 text-sm font-semibold text-white hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-300'
          >
            Search
          </button>
          <button
            type='button'
            onClick={() => {
              setQueryInterviewId('')
              if (selectedJobPosition && user?.email) {
                loadResults({
                  jobPosition: selectedJobPosition,
                  email: user.email,
                })
              } else {
                setRows([])
              }
            }}
            className='h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50'
          >
            Reset
          </button>
        </form>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
        <div className='rounded-xl border border-slate-200 bg-white p-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500'>
            Attempts
          </p>
          <p className='mt-1 text-2xl font-bold text-slate-900'>
            {displayedRows.length}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500'>
            Average Final Score
          </p>
          <p className='mt-1 text-2xl font-bold text-slate-900'>
            {computedAverage ?? '--'}
          </p>
        </div>
        <div className='rounded-xl border border-slate-200 bg-white p-4'>
          <p className='text-xs uppercase tracking-wide text-slate-500'>
            Filter
          </p>
          <p className='mt-1 text-sm font-semibold text-slate-900'>
            {selectedJobPosition
              ? `${selectedJobPosition}${queryInterviewId.trim() ? ` / ${queryInterviewId.trim()}` : ''}`
              : 'Select job position'}
          </p>
          <label className='mt-2 inline-flex cursor-pointer items-center gap-2 text-xs text-slate-700'>
            <input
              type='checkbox'
              checked={onlySuspicious}
              onChange={(event) => setOnlySuspicious(event.target.checked)}
              className='h-4 w-4 rounded border-slate-300'
            />
            Only suspicious attempts
          </label>
        </div>
      </div>

      <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'>
        <div className='overflow-x-auto'>
          <table className='min-w-full divide-y divide-slate-200 text-sm'>
            <thead className='bg-slate-50'>
              <tr>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Interview ID
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Candidate Name
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Answer Score
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Integrity Score
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Final Score
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Analyzed Answers
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Integrity Inputs (D/S/E/T)
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Detected Objects (Non-Person)
                </th>
                <th className='px-4 py-3 text-left font-semibold text-slate-600'>
                  Cheating Activity Frames
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100'>
              {isLoading && (
                <tr>
                  <td
                    colSpan={9}
                    className='px-4 py-6 text-center text-slate-500'
                  >
                    Loading results...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr>
                  <td
                    colSpan={9}
                    className='px-4 py-6 text-center text-rose-600'
                  >
                    {error}
                  </td>
                </tr>
              )}

              {!isLoading && !error && displayedRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className='px-4 py-6 text-center text-slate-500'
                  >
                    {selectedJobPosition
                      ? onlySuspicious
                        ? 'No suspicious attempts found for this job position.'
                        : 'No interview results found for this job position.'
                      : 'Select a job position to view results.'}
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                displayedRows.map((item) => (
                  <tr
                    key={`${item.interview_id}-${item.attempt_id}`}
                    className='hover:bg-slate-50'
                  >
                    <td className='px-4 py-3 font-medium text-slate-900'>
                      {item.interview_id}
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {item.candidate_name || 'Candidate'}
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {item.answer_score ?? '--'}
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {item.integrity_score ?? '--'}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800'>
                        {item.final_score ?? '--'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {item.analyzed_answers_count ?? '--'}
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      <span className='text-xs'>
                        D: {item?.integrity_components?.D ?? '--'} / S:{' '}
                        {item?.integrity_components?.S ?? '--'} / E:{' '}
                        {item?.integrity_components?.E ?? '--'} / T:{' '}
                        {item?.integrity_components?.T ?? '--'}
                      </span>
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {Array.isArray(item?.detected_non_person_classes) &&
                      item.detected_non_person_classes.length > 0 ? (
                        <div className='flex flex-wrap gap-1'>
                          {item.detected_non_person_classes.map((label) => (
                            <span
                              key={label}
                              className='inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800'
                            >
                              {label}
                              {Number(item?.detected_class_counts?.[label] || 0)
                                ? ` (${item.detected_class_counts[label]})`
                                : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '--'
                      )}
                    </td>
                    <td className='px-4 py-3 text-slate-700'>
                      {Array.isArray(item?.detection_snapshot_urls) &&
                      item.detection_snapshot_urls.length > 0 ? (
                        <div className='space-y-2'>
                          <a
                            href={item.detection_snapshot_urls[0]}
                            target='_blank'
                            rel='noreferrer'
                            className='inline-block'
                          >
                            <img
                              src={item.detection_snapshot_urls[0]}
                              alt='Cheating evidence frame'
                              className='h-16 w-24 rounded border border-slate-300 object-cover hover:opacity-90'
                            />
                          </a>

                          {item.detection_snapshot_urls.length > 1 && (
                            <details className='text-xs'>
                              <summary className='cursor-pointer text-sky-700 hover:text-sky-800'>
                                View all ({item.detection_snapshot_urls.length})
                              </summary>
                              <div className='mt-2 grid grid-cols-2 gap-2'>
                                {item.detection_snapshot_urls.map(
                                  (url, index) => (
                                    <a
                                      key={`${url}-${index}`}
                                      href={url}
                                      target='_blank'
                                      rel='noreferrer'
                                    >
                                      <img
                                        src={url}
                                        alt={`Cheating evidence ${index + 1}`}
                                        className='h-14 w-20 rounded border border-slate-300 object-cover'
                                      />
                                    </a>
                                  ),
                                )}
                              </div>
                            </details>
                          )}
                        </div>
                      ) : (
                        '--'
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default InterviewResultPage
