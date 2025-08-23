'use client'
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Star,
  Clock,
  Target,
  Eye,
  MessageSquare,
  Brain,
  Users,
  Download,
  Share2,
  Mail,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

const InterviewFeedback = ({ 
  interviewId, 
  candidateId, 
  focusMetrics, 
  answerScores, 
  finalScore,
  onClose 
}) => {
  const [feedback, setFeedback] = useState(null)
  const [recommendation, setRecommendation] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    if (interviewId && candidateId && finalScore) {
      generateFeedback()
    }
  }, [interviewId, candidateId, finalScore])

  const generateFeedback = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/interview-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          candidateId,
          focusMetrics,
          answerScores,
          finalScore
        })
      })

      if (response.ok) {
        const result = await response.json()
        setFeedback(result.feedback)
        setRecommendation(result.recommendation)
      } else {
        throw new Error('Failed to generate feedback')
      }
    } catch (error) {
      console.error('Error generating feedback:', error)
      toast.error('Failed to generate interview feedback')
    } finally {
      setIsLoading(false)
    }
  }

  const getRecommendationColor = (recommendation) => {
    switch (recommendation) {
      case 'strongly_recommend':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'recommend':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'consider':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'weak_consider':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  const getRecommendationIcon = (recommendation) => {
    switch (recommendation) {
      case 'strongly_recommend':
        return <Star className="h-5 w-5 text-green-600" />
      case 'recommend':
        return <CheckCircle className="h-5 w-5 text-blue-600" />
      case 'consider':
        return <Info className="h-5 w-5 text-yellow-600" />
      case 'weak_consider':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />
    }
  }

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return 'text-green-600'
    if (grade.startsWith('B')) return 'text-blue-600'
    if (grade.startsWith('C')) return 'text-yellow-600'
    return 'text-red-600'
  }

  const exportFeedback = () => {
    if (!feedback || !recommendation) return
    
    const feedbackData = {
      candidateId,
      interviewId,
      timestamp: new Date().toISOString(),
      overall: feedback.overall,
      focus: feedback.focus,
      answers: feedback.answers,
      behavioral: feedback.behavioral,
      technical: feedback.technical,
      recommendation: recommendation
    }
    
    const blob = new Blob([JSON.stringify(feedbackData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `interview-feedback-${candidateId}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Feedback exported successfully!')
  }

  const shareFeedback = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Interview Feedback',
        text: `Candidate ${candidateId} - ${feedback?.overall?.grade} Grade - ${recommendation?.recommendation}`,
        url: window.location.href
      })
    } else {
      // Fallback to copying to clipboard
      const feedbackText = `Interview Feedback for ${candidateId}\nGrade: ${feedback?.overall?.grade}\nRecommendation: ${recommendation?.recommendation}\nScore: ${Math.round(finalScore * 100)}%`
      navigator.clipboard.writeText(feedbackText)
      toast.success('Feedback copied to clipboard!')
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Generating comprehensive feedback...</p>
        </div>
      </div>
    )
  }

  if (!feedback || !recommendation) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Interview Feedback Report</h2>
              <p className="text-gray-600">Comprehensive analysis for hiring decision</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={exportFeedback}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={shareFeedback}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                size="sm"
              >
                ✕
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Executive Summary */}
          <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Star className="h-6 w-6" />
                Executive Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getGradeColor(feedback.overall.grade)} mb-2`}>
                    {feedback.overall.grade}
                  </div>
                  <div className="text-sm text-gray-600">Overall Grade</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {Math.round(finalScore * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Final Score</div>
                </div>
                <div className="text-center">
                  <Badge className={`text-lg px-4 py-2 ${getRecommendationColor(recommendation.recommendation)}`}>
                    {getRecommendationIcon(recommendation.recommendation)}
                    <span className="ml-2 capitalize">
                      {recommendation.recommendation.replace('_', ' ')}
                    </span>
                  </Badge>
                  <div className="text-sm text-gray-600 mt-2">Recommendation</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                <p className="text-gray-700">{feedback.overall.summary}</p>
              </div>
            </CardContent>
          </Card>

          {/* Hiring Recommendation */}
          <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <Target className="h-6 w-6" />
                Hiring Recommendation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Decision Reasoning</h4>
                  <p className="text-gray-700">{recommendation.reasoning}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Confidence Level</h4>
                  <Badge className={`text-sm px-3 py-1 ${
                    recommendation.confidence === 'high' ? 'bg-green-100 text-green-800' :
                    recommendation.confidence === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {recommendation.confidence.charAt(0).toUpperCase() + recommendation.confidence.slice(1)} Confidence
                  </Badge>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Next Steps</h4>
                <div className="space-y-2">
                  {recommendation.nextSteps.map((step, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Focus Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Focus & Attention Analysis
                </CardTitle>
                <CardDescription>
                  Eye movement, tab switching, and screen engagement
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Focus Score</span>
                    <Badge className="bg-blue-100 text-blue-800">
                      {Math.round(feedback.focus.score * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Strengths</h5>
                    {feedback.focus.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        {strength}
                      </div>
                    ))}
                  </div>
                  
                  {feedback.focus.concerns.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Areas of Concern</h5>
                      {feedback.focus.concerns.map((concern, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                          <AlertTriangle className="h-4 w-4" />
                          {concern}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answer Quality Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-purple-600" />
                  Answer Quality Analysis
                </CardTitle>
                <CardDescription>
                  Technical knowledge, relevance, and communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Answer Score</span>
                    <Badge className="bg-purple-100 text-purple-800">
                      {Math.round(feedback.answers.score * 100)}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Strengths</h5>
                    {feedback.answers.strengths.map((strength, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        {strength}
                      </div>
                    ))}
                  </div>
                  
                  {feedback.answers.areas.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="font-medium text-gray-900">Areas for Improvement</h5>
                      {feedback.answers.areas.map((area, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-orange-700">
                          <Info className="h-4 w-4" />
                          {area}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Behavioral & Technical Assessment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Behavioral Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  Behavioral Assessment
                </CardTitle>
                <CardDescription>
                  Engagement, professionalism, and communication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Engagement</span>
                      <Badge className={`${
                        feedback.behavioral.engagement.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.behavioral.engagement.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.behavioral.engagement.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {feedback.behavioral.engagement.level.charAt(0).toUpperCase() + feedback.behavioral.engagement.level.slice(1)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{feedback.behavioral.engagement.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Professionalism</span>
                      <Badge className={`${
                        feedback.behavioral.professionalism.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.behavioral.professionalism.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.behavioral.professionalism.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(feedback.behavioral.professionalism.score * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Communication</span>
                      <Badge className={`${
                        feedback.behavioral.communication.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.behavioral.communication.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.behavioral.communication.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(feedback.behavioral.communication.score * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{feedback.behavioral.communication.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Technical Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-indigo-600" />
                  Technical Assessment
                </CardTitle>
                <CardDescription>
                  Knowledge, problem-solving, and adaptability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Technical Knowledge</span>
                      <Badge className={`${
                        feedback.technical.knowledge.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.technical.knowledge.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.technical.knowledge.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(feedback.technical.knowledge.score * 100)}%
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{feedback.technical.knowledge.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Problem Solving</span>
                      <Badge className={`${
                        feedback.technical.problemSolving.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.technical.problemSolving.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.technical.problemSolving.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(feedback.technical.problemSolving.score * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Adaptability</span>
                      <Badge className={`${
                        feedback.technical.adaptability.level === 'excellent' ? 'bg-green-100 text-green-800' :
                        feedback.technical.adaptability.level === 'good' ? 'bg-blue-100 text-blue-800' :
                        feedback.technical.adaptability.level === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {Math.round(feedback.technical.adaptability.score * 100)}%
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Specific Recommendations */}
          {recommendation.specificRecommendations.length > 0 && (
            <Card className="border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-900">
                  <TrendingUp className="h-5 w-5" />
                  Development Recommendations
                </CardTitle>
                <CardDescription>
                  Specific actions to improve candidate performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recommendation.specificRecommendations.map((rec, index) => (
                    <div key={index} className="p-4 bg-white rounded-lg border border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.category}</h4>
                        <Badge className={`${
                          rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {rec.priority.charAt(0).toUpperCase() + rec.priority.slice(1)} Priority
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{rec.action}</p>
                      <p className="text-sm text-gray-600">{rec.impact}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-4 pt-6">
            <Button
              onClick={exportFeedback}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
            >
              <Download className="h-5 w-5 mr-2" />
              Export Report
            </Button>
            <Button
              onClick={shareFeedback}
              variant="outline"
              className="px-8 py-3 border-gray-300 hover:bg-gray-50"
            >
              <Share2 className="h-5 w-5 mr-2" />
              Share Feedback
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              className="px-8 py-3 text-gray-600 hover:bg-gray-100"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InterviewFeedback
