# Demo Mode Usage Guide

This document provides step-by-step instructions for using the demo mode feature in the Brand to Agency Adobe App Builder application.

## 🚀 Quick Start

**To run the application with demo mode:**

```bash
aio app run -e dx/excshell/1
```

That's it! Demo mode is automatically enabled and ready to use.

## Overview

Demo mode has been successfully implemented in the Brand to Agency application, providing:

- **✅ Mock Data**: 3 realistic company registrations with different statuses
- **✅ Simulated API Responses**: All API calls return mock responses with realistic 1-2 second delays
- **✅ Visual Indicators**: Clear "(Demo Mode)" labels and blue status indicators throughout the UI
- **✅ Full CRUD Operations**: Create, read, update, and delete operations work with local state
- **✅ Search & Filtering**: Fully functional search and status filtering
- **✅ Fallback Runtime**: Works without Adobe Experience Cloud Shell for local development

## Features Implemented

### 1. Environment-Based Feature Flag

Demo mode is automatically enabled based on environment variables:

```bash
# Automatically enabled in development
NODE_ENV=development

# Manual control via environment variable
REACT_APP_ENABLE_DEMO_MODE=true
```

### 2. UI Components with Demo Mode Support

#### Agency Registration View
- **Demo Mode Features**:
  - Pre-filled mock user data
  - Simulated form submission with 1.5s delay
  - Visual indicators showing demo mode status
  - Success/error message simulation

#### Company Registration List
- **Demo Mode Features**:
  - Mock company registration data (3 sample entries)
  - Full CRUD operations with local state management
  - Search and filtering functionality
  - Status management (pending, approved, rejected)
  - Delete confirmation dialogs

#### Home Page
- **Demo Mode Features**:
  - Demo mode indicator in page title
  - Status light showing demo mode is active

### 3. Mock Data Structure

The application includes realistic mock data:

```typescript
// Example mock company registration
{
    id: '1',
    name: 'Acme Creative Agency',
    primaryContact: 'John Smith',
    phoneNumber: '+1 (555) 123-4567',
    endPointUrl: 'https://demo.adobeioruntime.net/api/v1/web/acme/agency-event-handler',
    status: 'approved',
    createdAt: new Date('2024-01-15T10:30:00Z'),
    updatedAt: new Date('2024-01-16T14:22:00Z')
}
```

### 4. API Service Integration

The API service automatically switches to demo mode:

- **Mock responses** with realistic data structure
- **Simulated delays** (1-2 seconds) for realistic user experience
- **Automatic fallback** when Adobe services are unavailable

## 🎯 How to Run Demo Mode

### Method 1: Standard Adobe App Builder (Recommended)

```bash
aio app run -e dx/excshell/1
```

**Why this works automatically:**
- ✅ `REACT_APP_ENABLE_DEMO_MODE=true` is already set in your `_dot.env` file
- ✅ Demo mode auto-detects development environment
- ✅ No additional configuration needed

### Method 2: Using npm Scripts (Alternative)

```bash
npm run run:excshell
```

**Note:** The recommended approach is to use `aio app run -e dx/excshell/1` directly.

### Method 3: Force Demo Mode Off (For Testing Production Mode)

**Windows:**
```powershell
$env:REACT_APP_ENABLE_DEMO_MODE="false"; aio app run -e dx/excshell/1
```

**Unix/Linux/MacOS:**
```bash
REACT_APP_ENABLE_DEMO_MODE=false aio app run -e dx/excshell/1
```

## 👀 What You'll See When Demo Mode is Active

### Visual Indicators
1. **Page Titles**: All main headings include "(Demo Mode)" suffix
2. **Blue Status Indicators**: Info badges stating "Running in demo mode with mock data"
3. **Console Messages**: Browser console shows "[DEMO MODE]" prefixed logs
4. **Success Messages**: Include "(Demo Mode)" to indicate simulated responses

### Navigation Menu
You'll see navigation items in the blue header bar:
- **Home**: Welcome page with demo mode features overview
- **Agency Registration**: Company registration form
- **View Registrations**: Registration management interface
- **About**: Information about the application

### Header Features
- **Brand/Client Label**: Shows "Brand/Client (Demo Mode)" when active
- **User Email**: Displays the current user's email address
- **Demo Mode Indicator**: "Demo Mode Active" status light when enabled
- **Blue Color Scheme**: Professional Adobe Spectrum design

## 🎮 Demo Features Available

### 📝 Company Registration Form (Agency Registration Page)

**What you can do:**
- ✅ Fill out company registration form (name, contact, phone)
- ✅ Submit registration with 1.5-second simulated delay
- ✅ See success confirmation with demo mode indicator
- ✅ Reset form automatically after successful submission

**What you'll see:**
- Pre-filled email: `demo.user@example.com`
- Blue info badge: "Running in demo mode with mock data"
- Success message: "Registration submitted successfully! (Demo Mode)"

### 📊 Registration Management Interface (View Registrations Page)

**Mock Data Available:**
- **Acme Creative Agency** (Approved) - Contact: John Smith
- **Digital Marketing Solutions** (Pending) - Contact: Sarah Johnson  
- **Brand Experience Co** (Rejected) - Contact: Michael Chen

**What you can do:**
- ✅ **Search**: Filter by company name, contact name, or phone number
- ✅ **Filter by Status**: View All, Pending, Approved, or Rejected registrations
- ✅ **Approve/Reject**: Change status of pending registrations
- ✅ **Delete**: Remove registrations (with confirmation dialog)
- ✅ **View Details**: See creation dates, contact info, endpoint URLs

**Interactive Features:**
- Real-time search with instant filtering
- Status counters showing numbers for each category
- Action buttons for status management
- Confirmation dialogs for destructive actions
- Responsive table with sortable columns

### 🏠 Home Page

**What you'll see:**
- Title: "Welcome to Brand to Agency (Demo Mode)"
- Blue status indicator explaining demo mode is active

### 🔄 Realistic User Experience

**Loading States:**
- 1-2 second delays simulate real API response times
- Loading spinners and disabled buttons during operations
- Realistic state transitions

**Feedback Messages:**
- Success confirmations for all operations
- Error messages when appropriate
- Status updates with demo mode indicators

**Data Persistence:**
- Changes persist throughout your session
- Search and filter states maintained
- Form data handling identical to production

## Implementation Details

### Key Files

1. **`src/utils/demoMode.ts`**: Core demo mode configuration and utilities
2. **`src/components/layout/AgencyRegistrationView.tsx`**: Registration form with demo support
3. **`src/components/layout/CompanyRegistrationList.tsx`**: Registration management interface
4. **`src/components/App.js`**: Main app with demo mode routing
5. **`src/services/api.ts`**: API service with demo mode integration
6. **`src/index.js`**: Enhanced fallback runtime for demo mode

### Configuration Files

1. **`_dot.env`**: Environment variable configuration
2. **`package.json`**: Demo mode scripts
3. **`app.config.yaml`**: Adobe App Builder configuration

## Benefits

### For Development
- **No Backend Dependencies**: Develop UI without waiting for backend services
- **Consistent Data**: Reliable mock data for testing UI flows
- **Fast Iteration**: Immediate feedback without API delays

### For Demonstrations
- **Realistic Experience**: Mock data represents real-world scenarios
- **No Side Effects**: Demo actions don't affect production data
- **Always Available**: Works without network connectivity

### For Testing
- **UI Validation**: Test all user interactions without backend
- **Edge Cases**: Mock different data states and scenarios
- **Performance**: Measure UI performance without network latency

## Best Practices

1. **Always Check Demo Status**: Look for visual indicators
2. **Test Both Modes**: Validate functionality in demo and production modes
3. **Realistic Data**: Use mock data that represents actual use cases
4. **Clear Messaging**: Ensure users know they're in demo mode

## 🚨 Troubleshooting

### ❌ Demo Mode Not Activating

**Symptoms:** No "(Demo Mode)" in page titles, no blue status indicators

**Solutions:**
1. ✅ Check your `_dot.env` file contains: `REACT_APP_ENABLE_DEMO_MODE=true`
2. ✅ Restart the development server: `aio app run -e dx/excshell/1`
3. ✅ Check browser console for "[DEMO MODE]" messages
4. ✅ Verify you're not in production mode

### ❌ Mock Data Not Appearing

**Symptoms:** Empty registration list, no pre-filled form data

**Solutions:**
1. ✅ Open browser Developer Tools → Console
2. ✅ Look for "[DEMO MODE]" prefixed messages
3. ✅ Navigate to "View Registrations" page to see mock data
4. ✅ Refresh the page if data doesn't load

### ❌ "View Registrations" Menu Missing

**Symptoms:** Only see "Home" and "Agency Registration" in sidebar

**Solutions:**
1. ✅ Clear browser cache and refresh
2. ✅ Restart development server
3. ✅ Check for JavaScript errors in browser console

### ❌ API Calls Still Reaching Backend

**Symptoms:** Network requests in browser Dev Tools, real API errors

**Solutions:**
1. ✅ Confirm "[DEMO MODE]" appears in console logs
2. ✅ Check `REACT_APP_ENABLE_DEMO_MODE=true` in environment
3. ✅ Restart development server after environment changes

## ✅ How to Verify Demo Mode is Working

**Quick Checklist:**
1. ✅ Header shows "Brand/Client (Demo Mode)" label
2. ✅ Blue header with "Demo Mode Active" status indicator
3. ✅ Navigation menu in header (not sidebar)
4. ✅ Console shows "[DEMO MODE]" messages
5. ✅ "View Registrations" menu item appears in header
6. ✅ Registration list shows 3 mock companies
7. ✅ Form shows `demo.user@example.com` in header

## Future Enhancements

The demo mode foundation supports easy extension:

1. **Additional Mock Data**: More company types and scenarios
2. **Simulation Options**: User-configurable delay times
3. **Error Scenarios**: Mock different error conditions
4. **Demo Scenarios**: Guided demo workflows
5. **Export/Import**: Save and load demo data sets

This demo mode implementation provides a robust foundation for development, testing, and demonstration of the Brand to Agency application.
