'use client'
import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreditCard, Download, Receipt, DollarSign, Calendar, CheckCircle, AlertCircle, TrendingUp, Users, Zap } from 'lucide-react'

export default function Billings() {
  const [currentPlan] = useState('pro')
  
  const plans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'month',
      features: ['5 interviews/month', 'Basic AI analysis', 'Email support'],
      current: false,
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: 'month',
      features: ['Unlimited interviews', 'Advanced AI analysis', 'Priority support', 'Custom branding', 'Analytics dashboard'],
      current: true,
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'month',
      features: ['Everything in Pro', 'Team management', 'API access', 'White-label solution', 'Dedicated support'],
      current: false,
      popular: false
    }
  ]

  const billingHistory = [
    {
      id: 1,
      date: '2024-01-15',
      amount: '$29.00',
      status: 'paid',
      description: 'Pro Plan - January 2024',
      invoice: 'INV-2024-001'
    },
    {
      id: 2,
      date: '2023-12-15',
      amount: '$29.00',
      status: 'paid',
      description: 'Pro Plan - December 2023',
      invoice: 'INV-2023-012'
    },
    {
      id: 3,
      date: '2023-11-15',
      amount: '$29.00',
      status: 'paid',
      description: 'Pro Plan - November 2023',
      invoice: 'INV-2023-011'
    }
  ]

  const usageStats = [
    {
      title: 'Interviews This Month',
      value: '47',
      change: '+12%',
      changeType: 'positive',
      icon: TrendingUp
    },
    {
      title: 'Active Candidates',
      value: '23',
      change: '+5%',
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'AI Credits Used',
      value: '89%',
      change: '12 remaining',
      changeType: 'neutral',
      icon: Zap
    }
  ]

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Billing & Subscription</h1>
        <p className="text-gray-600">Manage your subscription, billing, and usage</p>
      </div>

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {usageStats.map((stat, index) => (
          <Card key={index} className="border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <stat.icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${
                plan.popular ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.popular && (
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                      Popular
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-500">/{plan.period}</span>
                </div>
                {plan.current && (
                  <Badge className="w-fit bg-green-100 text-green-800 border-green-200">
                    Current Plan
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.current 
                      ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                  }`}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Upgrade'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Billing History */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Billing History</h2>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Invoice
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {billingHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900">{item.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-gray-900">{item.amount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className="bg-green-100 text-green-800 border-green-200">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">{item.invoice}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-blue-600 hover:bg-blue-50"
                          >
                            <Receipt className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 px-3 text-gray-600 hover:bg-gray-50"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Method</h2>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">•••• •••• •••• 4242</p>
                  <p className="text-sm text-gray-500">Expires 12/25</p>
                </div>
              </div>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                Update
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Billing */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Billing</h2>
        <Card className="border-gray-100 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Next billing on February 15, 2024</p>
                  <p className="text-sm text-gray-500">Pro Plan - $29.00</p>
                </div>
              </div>
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                Cancel Subscription
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
