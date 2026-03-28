class InterviewTrackingService {
  constructor(interviewId, candidateId) {
    this.interviewId = interviewId
    this.candidateId = candidateId
    this.isTracking = false
    this.eyeTrackingInterval = null
    this.focusMonitoringInterval = null
    this.tabSwitchListeners = []
    this.focusMetrics = {
      eyeMovement: {
        distractions: 0,
        totalSamples: 0,
        focusTime: 0,
        lastStatus: 'unknown',
      },
      tabSwitches: {
        count: 0,
        uiSwitchCount: 0,
        totalTimeAway: 0,
        lastSwitchTime: Date.now(),
        isCurrentlyAway: false,
        awayStartedAt: null,
      },
      screenFocus: {
        percentage: 100,
        startTime: Date.now(),
      },
    }
    this.answers = []
    this.currentQuestion = null
  }

  // Start tracking all metrics
  startTracking() {
    if (this.isTracking) {
      console.log('Tracking already active')
      return
    }

    try {
      this.isTracking = true
      this.startTabMonitoring()
      this.startFocusMonitoring()

      console.log('Interview tracking started successfully')
    } catch (error) {
      console.error('Failed to start tracking:', error)
      this.isTracking = false
    }
  }

  // Stop tracking and cleanup
  stopTracking() {
    if (!this.isTracking) {
      console.log('Tracking already stopped')
      return
    }

    try {
      this.isTracking = false

      // If tracking stops while user is away, account for pending away duration.
      if (
        this.focusMetrics.tabSwitches.isCurrentlyAway &&
        this.focusMetrics.tabSwitches.awayStartedAt
      ) {
        const pendingAway = Math.max(
          0,
          Date.now() - this.focusMetrics.tabSwitches.awayStartedAt,
        )
        this.focusMetrics.tabSwitches.totalTimeAway += pendingAway
      }

      this.stopTabMonitoring()
      this.stopFocusMonitoring()

      console.log('Interview tracking stopped successfully')
    } catch (error) {
      console.error('Failed to stop tracking:', error)
    }
  }

  // Update gaze/focus observations using real camera analysis.
  // Expected input comes from object detection responses in the interview page.
  updateGazeObservation({ facePresent = true, personCount = 1 } = {}) {
    if (!this.isTracking) return

    // Eye focus should reflect on-screen behavior while the candidate is
    // actually on the interview tab. Tab-away time is tracked separately.
    if (this.focusMetrics.tabSwitches.isCurrentlyAway) {
      this.focusMetrics.eyeMovement.lastStatus = 'away'
      return
    }

    const isOnScreen = Boolean(facePresent) && Number(personCount) === 1
    this.updateFocusMetrics({ isOnScreen })
    this.focusMetrics.eyeMovement.lastStatus = isOnScreen
      ? 'focused'
      : 'needs_attention'
  }

  // Tab switch monitoring
  startTabMonitoring() {
    try {
      if (typeof document === 'undefined' || typeof window === 'undefined') {
        return
      }

      // Track when user switches away from the interview tab
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.handleTabSwitch('switch_away')
        } else {
          this.handleTabSwitch('switch_back')
        }
      }

      // Track when window loses focus
      const handleBlur = () => {
        this.handleTabSwitch('window_blur')
      }

      const handleFocus = () => {
        this.handleTabSwitch('window_focus')
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('blur', handleBlur)
      window.addEventListener('focus', handleFocus)

      this.tabSwitchListeners = [
        {
          target: 'document',
          type: 'visibilitychange',
          handler: handleVisibilityChange,
        },
        { type: 'blur', handler: handleBlur },
        { type: 'focus', handler: handleFocus },
      ]

      console.log('Tab monitoring started successfully')
    } catch (error) {
      console.error('Failed to start tab monitoring:', error)
    }
  }

  stopTabMonitoring() {
    try {
      this.tabSwitchListeners.forEach(({ target, type, handler }) => {
        if (target === 'document') {
          document.removeEventListener(type, handler)
        } else {
          window.removeEventListener(type, handler)
        }
      })
      this.tabSwitchListeners = []
      console.log('Tab monitoring stopped successfully')
    } catch (error) {
      console.error('Failed to stop tab monitoring:', error)
    }
  }

  // Handle tab switch events
  async handleTabSwitch(eventType) {
    if (!this.isTracking) return

    const now = Date.now()
    const wasAway = this.focusMetrics.tabSwitches.isCurrentlyAway
    const isAwayEvent =
      eventType === 'switch_away' || eventType === 'window_blur'
    const isBackEvent =
      eventType === 'switch_back' || eventType === 'window_focus'

    let timeSpent = 0

    // Only count away transitions once to avoid duplicate visibility/blur events.
    if (isAwayEvent && !wasAway) {
      this.focusMetrics.tabSwitches.isCurrentlyAway = true
      this.focusMetrics.tabSwitches.uiSwitchCount += 1
      this.focusMetrics.tabSwitches.awayStartedAt = now
      this.focusMetrics.tabSwitches.lastSwitchTime = now
      console.log('User switched away from interview')
    }

    // Only count back transitions once to avoid duplicate focus/visibility events.
    if (isBackEvent && wasAway) {
      const awayStartedAt = this.focusMetrics.tabSwitches.awayStartedAt || now
      timeSpent = Math.max(0, now - awayStartedAt)
      this.focusMetrics.tabSwitches.count += 1
      this.focusMetrics.tabSwitches.totalTimeAway += timeSpent
      this.focusMetrics.tabSwitches.isCurrentlyAway = false
      this.focusMetrics.tabSwitches.awayStartedAt = null
      this.focusMetrics.tabSwitches.lastSwitchTime = now

      console.log(
        `User returned to interview after ${timeSpent}ms, total switches: ${this.focusMetrics.tabSwitches.count}`,
      )
    }

    if ((isAwayEvent && wasAway) || (isBackEvent && !wasAway)) {
      return
    }

    const tabData = {
      eventType,
      timeSpent,
      url: window.location.href,
      title: document.title,
      timestamp: now,
    }

    try {
      // Send to FastAPI backend via Next.js API
      const response = await fetch('/api/tab-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: this.interviewId,
          candidateId: this.candidateId,
          tabData: {
            eventType: tabData.eventType,
            timeSpent: tabData.timeSpent,
            tabTitle: tabData.title,
            tabUrl: tabData.url,
          },
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        this.updateTabMetrics(result.processedData || tabData)
        console.log('Tab switch data sent to API successfully')
      }
    } catch (error) {
      console.error('Failed to track tab switch:', error)
    }
  }

  // Focus monitoring
  startFocusMonitoring() {
    try {
      this.focusMetrics.screenFocus.startTime = Date.now()

      // Update focus percentage based on time spent
      this.focusMonitoringInterval = setInterval(() => {
        if (!this.isTracking) return

        try {
          const totalTime = Date.now() - this.focusMetrics.screenFocus.startTime
          const effectiveTimeAway = this.getEffectiveTotalTimeAway()
          const focusTime = totalTime - effectiveTimeAway
          this.focusMetrics.screenFocus.percentage = Math.max(
            0,
            (focusTime / totalTime) * 100,
          )

          console.log(
            `Focus update - Total time: ${Math.round(
              totalTime / 1000,
            )}s, Time away: ${Math.round(
              effectiveTimeAway / 1000,
            )}s, Focus: ${Math.round(
              this.focusMetrics.screenFocus.percentage,
            )}%`,
          )
        } catch (error) {
          console.error('Error updating focus metrics:', error)
        }
      }, 5000) // Update every 5 seconds

      console.log('Focus monitoring started successfully')
    } catch (error) {
      console.error('Failed to start focus monitoring:', error)
    }
  }

  stopFocusMonitoring() {
    try {
      if (this.focusMonitoringInterval) {
        clearInterval(this.focusMonitoringInterval)
        this.focusMonitoringInterval = null
        console.log('Focus monitoring stopped successfully')
      }
    } catch (error) {
      console.error('Failed to stop focus monitoring:', error)
    }
  }

  // Update focus metrics based on tracking data
  updateFocusMetrics(eyeData) {
    if (eyeData?.isOnScreen === false) {
      this.focusMetrics.eyeMovement.distractions++
    }
    this.focusMetrics.eyeMovement.totalSamples++
  }

  // Update tab metrics
  updateTabMetrics(tabData) {
    // Local tab state is already authoritative. Keep this for API compatibility.
    if (!tabData) return
  }

  getEffectiveTotalTimeAway() {
    const baseAwayTime = this.focusMetrics.tabSwitches.totalTimeAway
    const currentAwayTime =
      this.focusMetrics.tabSwitches.isCurrentlyAway &&
      this.focusMetrics.tabSwitches.awayStartedAt
        ? Math.max(0, Date.now() - this.focusMetrics.tabSwitches.awayStartedAt)
        : 0

    return baseAwayTime + currentAwayTime
  }

  // Record candidate answers
  recordAnswer(question, response, scores = {}) {
    const answer = {
      question,
      response,
      timestamp: new Date().toISOString(),
      relevance_score: scores.relevance || 0.5,
      technical_score: scores.technical || 0.5,
      clarity_score: scores.clarity || 0.5,
    }

    this.answers.push(answer)
    console.log('Answer recorded:', answer)
  }

  // Set current question context
  setCurrentQuestion(question) {
    this.currentQuestion = question
  }

  // Calculate final score
  async calculateFinalScore() {
    try {
      const response = await fetch('/api/interview-scoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: this.interviewId,
          candidateId: this.candidateId,
          answers: this.answers,
          focusMetrics: this.focusMetrics,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        return result
      } else {
        throw new Error('Failed to calculate score')
      }
    } catch (error) {
      console.error('Failed to calculate final score:', error)
      throw error
    }
  }

  // Get current focus metrics
  getFocusMetrics() {
    const effectiveTimeAway = this.getEffectiveTotalTimeAway()
    const totalTrackedTime = Math.max(
      1,
      Date.now() - this.focusMetrics.screenFocus.startTime,
    )

    // Calculate focus score based on tab switches and time away
    const tabSwitchScore = Math.max(
      0,
      100 - this.focusMetrics.tabSwitches.count * 10,
    )
    const timeAwayScore = Math.max(0, 100 - (effectiveTimeAway / 1000) * 2)
    const overallFocusScore = Math.round((tabSwitchScore + timeAwayScore) / 2)
    const realTimeScreenFocusPercentage = Math.max(
      0,
      Math.round(
        ((totalTrackedTime - effectiveTimeAway) / totalTrackedTime) * 100,
      ),
    )

    return {
      ...this.focusMetrics,
      eyeMovement: {
        ...this.focusMetrics.eyeMovement,
        distractionRate:
          this.focusMetrics.eyeMovement.totalSamples > 0
            ? this.focusMetrics.eyeMovement.distractions /
              this.focusMetrics.eyeMovement.totalSamples
            : 0,
      },
      tabSwitches: {
        ...this.focusMetrics.tabSwitches,
        totalTimeAway: effectiveTimeAway,
        focusScore: overallFocusScore,
      },
      screenFocus: {
        ...this.focusMetrics.screenFocus,
        percentage: realTimeScreenFocusPercentage,
      },
    }
  }

  // Get tracking summary
  getTrackingSummary() {
    return {
      interviewId: this.interviewId,
      candidateId: this.candidateId,
      isTracking: this.isTracking,
      focusMetrics: this.getFocusMetrics(),
      answersCount: this.answers.length,
      currentQuestion: this.currentQuestion,
    }
  }
}

export default InterviewTrackingService
