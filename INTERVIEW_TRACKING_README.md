# 🎯 Interview Tracking & Scoring System

A comprehensive server-side tracking system for monitoring candidate behavior during AI interviews, including eye movement tracking, tab switch monitoring, and intelligent answer scoring.

## 🚀 Features

### 📊 **Real-time Tracking**

- **Eye Movement Monitoring** - Track gaze patterns and focus areas
- **Tab Switch Detection** - Monitor browser tab changes and distractions
- **Focus Metrics** - Calculate attention span and concentration levels
- **Answer Recording** - Capture and analyze candidate responses

### 🧮 **Intelligent Scoring**

- **Focus Score (40%)** - Based on eye movement and tab switches
- **Answer Score (60%)** - Based on response quality and relevance
- **Final Score Formula**: `(Focus Weight × Focus Score) + (Answer Weight × Answer Score)`

### 📈 **Analytics & Insights**

- **Real-time Metrics** - Live monitoring during interviews
- **Historical Data** - Track performance over time
- **Comparative Analysis** - Benchmark against other candidates
- **Detailed Reports** - Comprehensive performance breakdowns

## 🏗️ Architecture

### **API Endpoints**

#### 1. **Interview Tracking** (`/api/interview-tracking`)

- **POST**: Record tracking events (eye movement, tab switches, etc.)
- **GET**: Retrieve tracking data for analysis

#### 2. **Eye Tracking** (`/api/eye-tracking`)

- **POST**: Process and store eye movement data
- **GET**: Retrieve eye tracking metrics with time-based filtering

#### 3. **Tab Monitoring** (`/api/tab-monitoring`)

- **POST**: Track tab switch events and distractions
- **GET**: Analyze tab switching patterns and focus penalties

#### 4. **Interview Scoring** (`/api/interview-scoring`)

- **POST**: Calculate final scores using the weighted formula
- **GET**: Retrieve scoring results and breakdowns

### **Database Schema**

#### **Core Tables**

- `InterviewTracking` - All tracking events
- `InterviewScoring` - Calculated scores and weights
- `AnswerAnalysis` - Detailed answer evaluation
- `FocusSessions` - Focus session data

#### **Views & Functions**

- `InterviewSummary` - Comprehensive interview overview
- `CandidatePerformance` - Performance analysis
- `calculate_focus_score()` - Focus score calculation
- `get_interview_stats()` - Statistical analysis

## 🔧 Implementation

### **Client-Side Integration**

```javascript
import InterviewTrackingService from '@/services/interviewTrackingService'

// Initialize tracking service
const trackingService = new InterviewTrackingService(interviewId, candidateId)

// Start tracking
trackingService.startTracking()

// Record answers
trackingService.recordAnswer(question, response, {
  relevance: 0.8,
  technical: 0.9,
  clarity: 0.7,
})

// Calculate final score
const score = await trackingService.calculateFinalScore()
```

### **Tracking Metrics**

#### **Eye Movement Tracking**

```javascript
{
  gazeX: 800,           // X coordinate of gaze
  gazeY: 600,           // Y coordinate of gaze
  screenWidth: 1920,    // Screen dimensions
  screenHeight: 1080,
  confidence: 0.85,     // Tracking confidence (0-1)
  timestamp: 1640995200000
}
```

#### **Tab Switch Monitoring**

```javascript
{
  eventType: 'switch_away',  // switch_away, switch_back, new_tab
  timeSpent: 5000,           // Time away in milliseconds
  url: 'https://example.com',
  title: 'Page Title',
  timestamp: 1640995200000
}
```

#### **Focus Metrics**

```javascript
{
  eyeMovement: {
    distractions: 3,         // Number of off-screen gazes
    totalSamples: 120,       // Total tracking samples
    distractionRate: 0.025   // Distraction frequency
  },
  tabSwitches: {
    count: 2,                // Total tab switches
    totalTimeAway: 15000,    // Total time away in ms
    focusScore: 85           // Tab focus score (0-100)
  },
  screenFocus: {
    percentage: 92.5         // Percentage of time focused
  }
}
```

## 📊 Scoring Algorithm

### **Focus Score Calculation**

```javascript
function calculateFocusScore(focusMetrics) {
  let totalScore = 0
  let maxScore = 0

  // Eye movement tracking (0-100 points)
  if (focusMetrics.eyeMovement) {
    const eyeScore = Math.max(
      0,
      100 - focusMetrics.eyeMovement.distractions * 10,
    )
    totalScore += eyeScore
    maxScore += 100
  }

  // Tab switch tracking (0-100 points)
  if (focusMetrics.tabSwitches) {
    const tabScore = Math.max(0, 100 - focusMetrics.tabSwitches.count * 15)
    totalScore += tabScore
    maxScore += 100
  }

  // Screen focus time (0-100 points)
  if (focusMetrics.screenFocus) {
    const focusTimeScore = (focusMetrics.screenFocus.percentage / 100) * 100
    totalScore += focusTimeScore
    maxScore += 100
  }

  return maxScore > 0 ? totalScore / maxScore : 0
}
```

### **Answer Score Calculation**

```javascript
function calculateAnswerScore(answers) {
  let totalScore = 0
  let maxScore = 0

  answers.forEach((answer) => {
    let questionScore = 0

    // Completeness (0-25 points)
    if (answer.response && answer.response.length > 10) {
      questionScore += Math.min(25, answer.response.length / 2)
    }

    // Relevance (0-25 points)
    if (answer.relevance_score) {
      questionScore += answer.relevance_score * 25
    }

    // Technical accuracy (0-25 points)
    if (answer.technical_score) {
      questionScore += answer.technical_score * 25
    }

    // Communication clarity (0-25 points)
    if (answer.clarity_score) {
      questionScore += answer.clarity_score * 25
    }

    totalScore += questionScore
    maxScore += 100
  })

  return maxScore > 0 ? totalScore / maxScore : 0
}
```

## 🎨 Usage Examples

### **Basic Tracking Setup**

```javascript
// In your interview component
useEffect(() => {
  const trackingService = new InterviewTrackingService(interviewId, candidateId)

  // Start tracking when interview begins
  trackingService.startTracking()

  // Cleanup when component unmounts
  return () => {
    trackingService.stopTracking()
  }
}, [interviewId, candidateId])
```

### **Recording Answers**

```javascript
// When candidate provides an answer
const handleAnswerSubmit = async (question, response) => {
  // Record the answer with scores
  trackingService.recordAnswer(question, response, {
    relevance: calculateRelevanceScore(question, response),
    technical: calculateTechnicalScore(response),
    clarity: calculateClarityScore(response),
  })
}
```

### **Getting Final Score**

```javascript
// At the end of the interview
const handleInterviewEnd = async () => {
  try {
    const scoreResult = await trackingService.calculateFinalScore()

    console.log('Final Score:', scoreResult.finalScore)
    console.log('Focus Score:', scoreResult.focusScore)
    console.log('Answer Score:', scoreResult.answerScore)
    console.log('Breakdown:', scoreResult.breakdown)
  } catch (error) {
    console.error('Failed to calculate score:', error)
  }
}
```

## 🔒 Privacy & Security

### **Data Protection**

- **Local Processing** - Eye tracking data processed client-side
- **Encrypted Storage** - All data encrypted in transit and at rest
- **User Consent** - Explicit permission required for tracking
- **Data Retention** - Configurable data retention policies

### **Compliance**

- **GDPR Compliant** - Right to be forgotten and data portability
- **CCPA Ready** - California privacy law compliance
- **SOC 2** - Security and privacy standards
- **HIPAA** - Healthcare data protection (if applicable)

## 🚀 Future Enhancements

### **Advanced Features**

- **AI-Powered Analysis** - Machine learning for better scoring
- **Behavioral Patterns** - Identify cheating patterns
- **Real-time Alerts** - Notify administrators of suspicious activity
- **Mobile Support** - Extend tracking to mobile devices

### **Integration Options**

- **HR Systems** - ATS and HRIS integration
- **Analytics Platforms** - Business intelligence tools
- **Video Platforms** - Zoom, Teams, Google Meet
- **Learning Management** - LMS integration for training

## 📚 API Documentation

### **Authentication**

All API endpoints require proper authentication headers:

```bash
Authorization: Bearer <your-token>
Content-Type: application/json
```

### **Rate Limiting**

- **Eye Tracking**: 1 request per second
- **Tab Monitoring**: 1 request per 5 seconds
- **General Tracking**: 10 requests per minute
- **Scoring**: 1 request per interview

### **Error Handling**

```javascript
{
  "error": "Error message",
  "status": 400,
  "details": "Additional error details"
}
```

## 🛠️ Development Setup

### **Prerequisites**

- Node.js 18+
- PostgreSQL 13+
- Supabase account
- Modern browser with camera access

### **Installation**

```bash
# Clone the repository
git clone <repository-url>

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:migrate

# Start development server
npm run dev
```

### **Environment Variables**

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# API Keys
NEXT_PUBLIC_VAPI_PUBLIC_KEY=your_vapi_key

# Tracking Configuration
TRACKING_ENABLED=true
TRACKING_SAMPLE_RATE=1000
TRACKING_RETENTION_DAYS=90
```

## 📞 Support

### **Getting Help**

- **Documentation**: [Link to docs]
- **GitHub Issues**: [Repository issues]
- **Email Support**: support@company.com
- **Live Chat**: Available during business hours

### **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

---
