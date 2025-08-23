'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Globe, 
  Key, 
  Mail, 
  Smartphone, 
  Eye, 
  EyeOff,
  Save,
  Download,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function Settings() {
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    company: 'Tech Corp',
    timezone: 'UTC-5',
    language: 'en',
    theme: 'light'
  })

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    interviewReminders: true,
    weeklyReports: false,
    marketingEmails: false
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    dataSharing: false,
    analytics: true,
    cookies: true
  })

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({ ...prev, [field]: value }))
  }

  const handlePrivacyChange = (field, value) => {
    setPrivacy(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    toast.success('Settings saved successfully!')
    console.log('Settings saved:', { formData, notifications, privacy })
  }

  const handleExportData = () => {
    toast.success('Data export started!')
  }

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      toast.success('Account deletion request submitted')
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Profile Settings */}
      <Card className="border-gray-100 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <Input
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="h-11"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Timezone
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
                className="w-full h-11 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="UTC-8">UTC-8 (Pacific)</option>
                <option value="UTC-5">UTC-5 (Eastern)</option>
                <option value="UTC+0">UTC+0 (London)</option>
                <option value="UTC+1">UTC+1 (Paris)</option>
                <option value="UTC+5:30">UTC+5:30 (Mumbai)</option>
                <option value="UTC+8">UTC+8 (Singapore)</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-gray-100 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-green-600" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Choose how and when you want to be notified
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive notifications via email</p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(value) => handleNotificationChange('emailNotifications', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Push Notifications</p>
              <p className="text-sm text-gray-500">Receive push notifications in your browser</p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(value) => handleNotificationChange('pushNotifications', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Interview Reminders</p>
              <p className="text-sm text-gray-500">Get reminded about upcoming interviews</p>
            </div>
            <Switch
              checked={notifications.interviewReminders}
              onCheckedChange={(value) => handleNotificationChange('interviewReminders', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Weekly Reports</p>
              <p className="text-sm text-gray-500">Receive weekly performance summaries</p>
            </div>
            <Switch
              checked={notifications.weeklyReports}
              onCheckedChange={(value) => handleNotificationChange('weeklyReports', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Marketing Emails</p>
              <p className="text-sm text-gray-500">Receive updates about new features</p>
            </div>
            <Switch
              checked={notifications.marketingEmails}
              onCheckedChange={(value) => handleNotificationChange('marketingEmails', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card className="border-gray-100 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-600" />
            Privacy & Security
          </CardTitle>
          <CardDescription>
            Control your privacy settings and security preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Profile Visibility</p>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select
              value={privacy.profileVisibility}
              onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="contacts">Contacts Only</option>
            </select>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Data Sharing</p>
              <p className="text-sm text-gray-500">Allow data to be used for research</p>
            </div>
            <Switch
              checked={privacy.dataSharing}
              onCheckedChange={(value) => handlePrivacyChange('dataSharing', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Analytics</p>
              <p className="text-sm text-gray-500">Help improve the platform with usage analytics</p>
            </div>
            <Switch
              checked={privacy.analytics}
              onCheckedChange={(value) => handlePrivacyChange('analytics', value)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Cookies</p>
              <p className="text-sm text-gray-500">Accept cookies for better experience</p>
            </div>
            <Switch
              checked={privacy.cookies}
              onCheckedChange={(value) => handlePrivacyChange('cookies', value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card className="border-gray-100 shadow-sm mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-orange-600" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data or delete your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900">Export Data</p>
              <p className="text-sm text-gray-500">Download all your data in JSON format</p>
            </div>
            <Button
              variant="outline"
              onClick={handleExportData}
              className="border-gray-300 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-gray-900 text-red-600">Delete Account</p>
              <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
            </div>
            <Button
              variant="outline"
              onClick={handleDeleteAccount}
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          className="px-6 py-3 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
        >
          Reset to Defaults
        </Button>
        <Button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5"
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  )
}
