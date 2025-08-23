# 🧪 Tab Switching & Focus Concentration Testing Guide

This guide explains how to test and verify that the tab switching detection and focus concentration tracking is working properly in the interview system.

## 🚀 How to Test

### 1. **Start an Interview**

- Navigate to the interview start page
- The tracking service should automatically initialize and start monitoring
- Check the browser console for tracking service logs

### 2. **Test Tab Switching**

- **Switch to another tab**: Click on a different browser tab
- **Switch back**: Return to the interview tab
- **Minimize window**: Minimize the browser window
- **Restore window**: Restore the browser window
- **Open new tab**: Press `Ctrl+T` (or `Cmd+T` on Mac) to open a new tab

### 3. **Monitor Console Logs**

Look for these console messages:

```
Tab switch event: switch_away, time spent: 0ms
User switched away from interview
Tab switch event: switch_back, time spent: 5000ms
User returned to interview after 5000ms, total switches: 1
Tab switch data sent to API successfully
```

### 4. **Check Focus Metrics**

The focus metrics should update in real-time:

- **Tab Focus Score**: Should decrease with each tab switch
- **Screen Focus Percentage**: Should decrease when away from the interview
- **Switch Count**: Should increment with each tab switch

## 🔧 Development Testing

### Test Controls (Development Mode Only)

When `NODE_ENV === 'development'`, you'll see test buttons:

- **Simulate Tab Away**: Manually trigger a tab switch away event
- **Simulate Tab Back**: Manually trigger a tab switch back event
- **Refresh Metrics**: Manually refresh the focus metrics display

### Manual Testing Commands

```javascript
// In browser console, you can manually test:
if (window.trackingService) {
  // Simulate tab switch away
  window.trackingService.handleTabSwitch('switch_away')

  // Wait a few seconds, then simulate return
  setTimeout(() => {
    window.trackingService.handleTabSwitch('switch_back')
  }, 3000)

  // Check current metrics
  console.log(window.trackingService.getFocusMetrics())
}
```

## 📊 Expected Behavior

### Tab Switch Detection

- ✅ **Visibility Change**: Detects when tab becomes hidden/visible
- ✅ **Window Blur/Focus**: Detects when window loses/gains focus
- ✅ **Before Unload**: Detects when navigating away from page
- ✅ **Real-time Updates**: Metrics update immediately in UI

### Focus Score Calculation

- **Base Score**: 100 points
- **Tab Switch Penalty**: -10 points per switch
- **Time Away Penalty**: -2 points per second away
- **Final Score**: Average of tab switch and time away scores

### Focus Percentage

- **Formula**: `(Total Time - Time Away) / Total Time * 100`
- **Updates**: Every 5 seconds
- **Range**: 0% to 100%

## 🐛 Troubleshooting

### Common Issues

1. **Tracking Not Starting**

   - Check browser console for errors
   - Verify `InterviewTrackingService` is imported
   - Check if `interviewInfo` is properly set

2. **Tab Switches Not Detected**

   - Ensure browser supports `visibilitychange` event
   - Check if ad blockers are interfering
   - Verify event listeners are properly attached

3. **Focus Metrics Not Updating**

   - Check if `trackingIntervalRef` is working
   - Verify `getFocusMetrics()` returns proper data
   - Check for JavaScript errors in console

4. **API Calls Failing**
   - Check network tab for failed requests
   - Verify `/api/tab-monitoring` endpoint is working
   - Check database connection and schema

### Debug Commands

```javascript
// Check tracking service status
console.log('Tracking Service:', window.trackingService)
console.log('Is Tracking:', window.trackingService?.isTracking)
console.log('Focus Metrics:', window.trackingService?.getFocusMetrics())

// Check event listeners
console.log('Tab Switch Listeners:', window.trackingService?.tabSwitchListeners)

// Force refresh metrics
window.trackingService?.getFocusMetrics()
```

## 📈 Performance Monitoring

### Memory Leaks Prevention

- ✅ Event listeners are properly removed on cleanup
- ✅ Intervals are cleared when stopping tracking
- ✅ References are nullified after cleanup

### Real-time Updates

- **Eye Tracking**: Every 1 second
- **Focus Metrics**: Every 5 seconds
- **UI Updates**: Every 2 seconds
- **Tab Switch Events**: Immediate

## 🎯 Success Criteria

The tab switching and focus concentration is working correctly when:

1. ✅ Tab switches are detected and logged in console
2. ✅ Focus metrics update in real-time
3. ✅ Tab switch count increments correctly
4. ✅ Focus score decreases with distractions
5. ✅ Screen focus percentage reflects actual focus time
6. ✅ No memory leaks or console errors
7. ✅ API calls succeed and return proper responses

## 🔄 Testing Checklist

- [ ] Interview tracking service initializes
- [ ] Tab switch events are detected
- [ ] Focus metrics update in real-time
- [ ] Tab switch count increments
- [ ] Focus score decreases with distractions
- [ ] Screen focus percentage updates
- [ ] No console errors
- [ ] API calls succeed
- [ ] Test controls work (dev mode)
- [ ] Cleanup works properly

