class InterviewTrackingService {
  constructor(interviewId, candidateId) {
    this.interviewId = interviewId
    this.candidateId = candidateId
    this.isTracking = false
    this.eyeTrackingInterval = null
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
    if (this.isTracking) return

    this.isTracking = true
    this.startEyeTracking()
    this.startTabMonitoring()
    this.startFocusMonitoring()

    console.log('Interview tracking started')
  }

  // Stop tracking and cleanup
  stopTracking() {
    if (!this.isTracking) return

    this.isTracking = false
    this.stopEyeTracking()
    this.stopTabMonitoring()
    this.stopFocusMonitoring()

    console.log('Interview tracking stopped')
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

  // Track eye movement data
  async trackEyeMovement(eyeData) {
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
    // Track when user switches away from the interview tab
    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.handleTabSwitch('switch_away')
      } else {
        this.handleTabSwitch('switch_back')
      }
    }

    // Track when user opens new tabs
    const handleBeforeUnload = () => {
      this.handleTabSwitch('new_tab')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    this.tabSwitchListeners = [
      { type: 'visibilitychange', handler: handleVisibilityChange },
      { type: 'beforeunload', handler: handleBeforeUnload },
    ]
  }

  stopTabMonitoring() {
    this.tabSwitchListeners.forEach(({ type, handler }) => {
      if (type === 'beforeunload') {
        window.removeEventListener(type, handler)
      } else {
        document.removeEventListener(type, handler)
      }
    })
    this.tabSwitchListeners = []
  }

  // Handle tab switch events
  async handleTabSwitch(eventType) {
    if (!this.isTracking) return

    const now = Date.now()
    const timeSpent = now - this.focusMetrics.tabSwitches.lastSwitchTime

    const tabData = {
      eventType,
      previousTab: document.title,
      currentTab: document.title,
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
      }
    } catch (error) {
      console.error('Failed to track tab switch:', error)
    }

    this.focusMetrics.tabSwitches.lastSwitchTime = now
  }

  // Focus monitoring
  startFocusMonitoring() {
    this.focusMetrics.screenFocus.startTime = Date.now()

    // Update focus percentage based on time spent
    setInterval(() => {
      if (!this.isTracking) return

      const totalTime = Date.now() - this.focusMetrics.screenFocus.startTime
      const focusTime = totalTime - this.focusMetrics.tabSwitches.totalTimeAway
      this.focusMetrics.screenFocus.percentage = (focusTime / totalTime) * 100
    }, 5000) // Update every 5 seconds
  }

  stopFocusMonitoring() {
    // Cleanup focus monitoring
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
