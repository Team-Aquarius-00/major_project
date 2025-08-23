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
      },
      tabSwitches: {
        count: 0,
        totalTimeAway: 0,
        lastSwitchTime: Date.now(),
        isCurrentlyAway: false,
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
      this.startEyeTracking()
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
      this.stopEyeTracking()
      this.stopTabMonitoring()
      this.stopFocusMonitoring()

      console.log('Interview tracking stopped successfully')
    } catch (error) {
      console.error('Failed to stop tracking:', error)
    }
  }

  // Eye tracking simulation (in real implementation, this would use webcam + ML)
  startEyeTracking() {
    this.eyeTrackingInterval = setInterval(() => {
      if (!this.isTracking) return

      // Simulate eye tracking data (replace with actual webcam tracking)
      const eyeData = this.simulateEyeTracking()
      this.trackEyeMovement(eyeData)
    }, 1000) // Sample every second
  }

  stopEyeTracking() {
    if (this.eyeTrackingInterval) {
      clearInterval(this.eyeTrackingInterval)
      this.eyeTrackingInterval = null
    }
  }

  // Simulate eye tracking (replace with actual implementation)
  simulateEyeTracking() {
    const screenWidth = window.innerWidth
    const screenHeight = window.innerHeight

    // Simulate gaze position (center-focused with some variation)
    const centerX = screenWidth / 2
    const centerY = screenHeight / 2

    // Add some realistic variation
    const variationX = (Math.random() - 0.5) * 200
    const variationY = (Math.random() - 0.5) * 200

    const gazeX = centerX + variationX
    const gazeY = centerY + variationY

    // Simulate confidence (higher when closer to center)
    const distanceFromCenter = Math.sqrt(
      Math.pow(gazeX - centerX, 2) + Math.pow(gazeY - centerY, 2)
    )
    const confidence = Math.max(0.3, 1 - distanceFromCenter / 500)

    return {
      gazeX,
      gazeY,
      screenWidth,
      screenHeight,
      confidence,
      timestamp: Date.now(),
    }
  }

  // Track eye movement and send to API
  async trackEyeMovement(eyeData) {
    if (!this.isTracking) return

    // Determine if gaze is on screen
    const isOnScreen =
      eyeData.gazeX >= 0 &&
      eyeData.gazeX <= eyeData.screenWidth &&
      eyeData.gazeY >= 0 &&
      eyeData.gazeY <= eyeData.screenHeight

    const processedData = {
      isOnScreen,
      confidence: eyeData.confidence,
      distanceFromCenter: Math.sqrt(
        Math.pow(eyeData.gazeX - eyeData.screenWidth / 2, 2) +
          Math.pow(eyeData.gazeY - eyeData.screenHeight / 2, 2)
      ),
    }

    this.updateFocusMetrics(processedData)

    try {
      const response = await fetch('/api/eye-tracking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: this.interviewId,
          candidateId: this.candidateId,
          eyeData,
          processedData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        this.updateFocusMetrics(result.processedData)
      }
    } catch (error) {
      console.error('Failed to track eye movement:', error)
    }
  }

  // Tab switch monitoring
  startTabMonitoring() {
    try {
      // Track when user switches away from the interview tab
      const handleVisibilityChange = () => {
        if (document.hidden) {
          this.handleTabSwitch('switch_away')
        } else {
          this.handleTabSwitch('switch_back')
        }
      }

      // Track when user opens new tabs or navigates away
      const handleBeforeUnload = () => {
        this.handleTabSwitch('new_tab')
      }

      // Track when window loses focus
      const handleBlur = () => {
        this.handleTabSwitch('window_blur')
      }

      const handleFocus = () => {
        this.handleTabSwitch('window_focus')
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)
      window.addEventListener('beforeunload', handleBeforeUnload)
      window.addEventListener('blur', handleBlur)
      window.addEventListener('focus', handleFocus)

      this.tabSwitchListeners = [
        { type: 'visibilitychange', handler: handleVisibilityChange },
        { type: 'beforeunload', handler: handleBeforeUnload },
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
      this.tabSwitchListeners.forEach(({ type, handler }) => {
        if (type === 'beforeunload') {
          window.removeEventListener(type, handler)
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
    const timeSpent = now - this.focusMetrics.tabSwitches.lastSwitchTime

    console.log(`Tab switch event: ${eventType}, time spent: ${timeSpent}ms`)

    // Update local metrics immediately for real-time updates
    if (eventType === 'switch_away' || eventType === 'window_blur') {
      this.focusMetrics.tabSwitches.isCurrentlyAway = true
      this.focusMetrics.tabSwitches.lastSwitchTime = now
      console.log('User switched away from interview')
    } else if (eventType === 'switch_back' || eventType === 'window_focus') {
      if (this.focusMetrics.tabSwitches.isCurrentlyAway) {
        this.focusMetrics.tabSwitches.count++
        this.focusMetrics.tabSwitches.totalTimeAway += timeSpent
        this.focusMetrics.tabSwitches.isCurrentlyAway = false
        console.log(
          `User returned to interview after ${timeSpent}ms, total switches: ${this.focusMetrics.tabSwitches.count}`
        )
      }
      this.focusMetrics.tabSwitches.lastSwitchTime = now
    }

    const tabData = {
      eventType,
      timeSpent,
      url: window.location.href,
      title: document.title,
      timestamp: now,
    }

    try {
      const response = await fetch('/api/tab-monitoring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId: this.interviewId,
          candidateId: this.candidateId,
          tabData,
          timestamp: new Date().toISOString(),
        }),
      })

      if (response.ok) {
        const result = await response.json()
        this.updateTabMetrics(result.processedData)
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
          const focusTime =
            totalTime - this.focusMetrics.tabSwitches.totalTimeAway
          this.focusMetrics.screenFocus.percentage = Math.max(
            0,
            (focusTime / totalTime) * 100
          )

          console.log(
            `Focus update - Total time: ${Math.round(
              totalTime / 1000
            )}s, Time away: ${Math.round(
              this.focusMetrics.tabSwitches.totalTimeAway / 1000
            )}s, Focus: ${Math.round(
              this.focusMetrics.screenFocus.percentage
            )}%`
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
    if (eyeData.isOnScreen === false) {
      this.focusMetrics.eyeMovement.distractions++
    }
    this.focusMetrics.eyeMovement.totalSamples++
  }

  // Update tab metrics
  updateTabMetrics(tabData) {
    if (tabData.isDistraction) {
      this.focusMetrics.tabSwitches.count++
      this.focusMetrics.tabSwitches.totalTimeAway += tabData.timeSpent
    }
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
    // Calculate focus score based on tab switches and time away
    const tabSwitchScore = Math.max(
      0,
      100 - this.focusMetrics.tabSwitches.count * 10
    )
    const timeAwayScore = Math.max(
      0,
      100 - (this.focusMetrics.tabSwitches.totalTimeAway / 1000) * 2
    )
    const overallFocusScore = Math.round((tabSwitchScore + timeAwayScore) / 2)

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
        focusScore: overallFocusScore,
      },
      screenFocus: {
        ...this.focusMetrics.screenFocus,
        percentage: Math.round(this.focusMetrics.screenFocus.percentage),
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
