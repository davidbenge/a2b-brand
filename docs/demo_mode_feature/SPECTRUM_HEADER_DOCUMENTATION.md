# Spectrum Header Component Documentation

## 📋 Overview

The `SpectrumHeader` component is a custom header implementation using Adobe React Spectrum components. It provides navigation, branding, and user information display for the Brand/Client application.

## 🏗️ Component Structure

### **File Location:**
```
src/dx-excshell-1/web-src/src/components/common/SpectrumHeader.tsx
```

### **Component Interface:**
```typescript
interface SpectrumHeaderProps {
    viewProps?: any; // Contains IMS profile and other Adobe App Builder context
}
```

## 🎨 Design & Layout

### **Visual Design:**
- **Background:** Adobe Blue (`blue-600`) with darker border (`blue-700`)
- **Text Colors:** White for primary text, semi-transparent white for secondary
- **Layout:** Responsive flexbox with proper spacing and alignment
- **Navigation:** Clean button-style navigation with active state indicators

### **Layout Structure:**
```
┌─────────────────────────────────────────────────────────────┐
│ [Brand/Client (Demo Mode)] [Nav Items] [Demo Mode Active]   │
│ [user@email.com]                                            │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 React Spectrum Components Used

### **1. View**
- **Purpose:** Main container with background styling
- **Props:**
  - `backgroundColor="blue-600"` - Adobe brand color
  - `paddingX="size-300"` - Horizontal padding
  - `paddingY="size-200"` - Vertical padding
  - `borderBottomWidth="thick"` - Bottom border
  - `borderBottomColor="blue-700"` - Darker border color

### **2. Flex**
- **Purpose:** Layout container for responsive design
- **Props:**
  - `direction="row"` - Horizontal layout
  - `justifyContent="space-between"` - Space elements evenly
  - `alignItems="center"` - Vertical centering
  - `wrap` - Allow wrapping on smaller screens
  - `gap="size-200"` - Consistent spacing

### **3. Text**
- **Purpose:** Typography for labels and user information
- **Usage:**
  - Main title: "Brand/Client (Demo Mode)"
  - User email: Displayed below main title
  - Navigation labels: Button text

### **4. ActionButton**
- **Purpose:** Navigation buttons with hover and active states
- **Props:**
  - `isQuiet` - Minimal styling
  - `onPress` - Navigation handler
  - Custom styling for active/inactive states

### **5. StatusLight**
- **Purpose:** Demo mode indicator
- **Props:**
  - `variant="info"` - Blue information styling
  - Custom styling for white text on blue background

## 🧭 Navigation System

### **Navigation Items:**
```typescript
const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Agency Registration', path: '/agencies' },
    { label: 'View Registrations', path: '/registrations' },
    { label: 'Sync Status', path: '/sync' },
    { label: 'About', path: '/about' }
];
```

### **Active State Logic:**
```typescript
const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
        return true;
    }
    return path !== '/' && location.pathname.startsWith(path);
};
```

### **Navigation Features:**
- **Active State Highlighting:** Current page is visually distinguished
- **Hover Effects:** Smooth transitions on button interactions
- **Responsive Design:** Navigation wraps on smaller screens
- **Accessibility:** Proper ARIA labels and keyboard navigation

## 🎭 Demo Mode Integration

### **Demo Mode Detection:**
```typescript
import { ENABLE_DEMO_MODE } from '../../utils/demoMode';
```

### **Demo Mode Features:**
1. **Title Suffix:** Adds "(Demo Mode)" to main title
2. **Status Indicator:** Shows "Demo Mode Active" with StatusLight
3. **Visual Cues:** Clear indication of demo environment

## 👤 User Information Display

### **IMS Profile Integration:**
```typescript
{viewProps?.imsProfile?.email && (
    <Text UNSAFE_style={{ 
        color: 'rgba(255, 255, 255, 0.8)', 
        fontSize: '12px' 
    }}>
        {viewProps.imsProfile.email}
    </Text>
)}
```

### **User Context:**
- **Email Display:** Shows logged-in user's email
- **Conditional Rendering:** Only displays if email is available
- **Styling:** Subtle secondary text styling

## 🎨 Custom Styling

### **UNSAFE_style Usage:**
The component uses `UNSAFE_style` for custom styling that extends beyond React Spectrum's design tokens:

```typescript
UNSAFE_style={{
    color: isActive(item.path) ? 'white' : 'rgba(255, 255, 255, 0.8)',
    backgroundColor: isActive(item.path) 
        ? 'rgba(255, 255, 255, 0.2)' 
        : 'transparent',
    borderRadius: '4px',
    padding: '8px 16px',
    fontWeight: isActive(item.path) ? 'bold' : 'normal',
    border: 'none',
    transition: 'all 0.2s ease',
    minHeight: '36px'
}}
```

### **CSS Custom Properties:**
```typescript
UNSAFE_style={{
    '--spectrum-global-color-status-info': '#ffffff',
    color: 'white'
}}
```

## 🔗 Integration Points

### **App.js Integration:**
```javascript
import SpectrumHeader from './common/SpectrumHeader'

// In render:
<SpectrumHeader viewProps={safeViewProps} />
```

### **ViewProps Structure:**
```typescript
interface ViewProps {
    imsProfile?: {
        email?: string;
        // Other IMS profile properties
    };
    // Other Adobe App Builder context
}
```

## 🎯 Key Features

### **1. Responsive Design**
- Flexbox layout adapts to different screen sizes
- Navigation items wrap on smaller screens
- Consistent spacing with Spectrum design tokens

### **2. Accessibility**
- Proper semantic HTML structure
- Keyboard navigation support
- Screen reader friendly labels
- High contrast color scheme

### **3. Brand Consistency**
- Adobe brand colors (blue-600, blue-700)
- Consistent with Adobe App Builder design patterns
- Professional appearance matching Adobe applications

### **4. State Management**
- Active navigation state tracking
- Demo mode detection and display
- User profile information integration

## 🛠️ Customization Options

### **Changing Colors:**
```typescript
// Update background color
backgroundColor="blue-600" // Change to any Spectrum color

// Update border color
borderBottomColor="blue-700" // Change to any Spectrum color
```

### **Adding Navigation Items:**
```typescript
const navItems = [
    // ... existing items
    { label: 'New Page', path: '/new-page' }
];
```

### **Modifying Demo Mode Display:**
```typescript
// Change demo mode indicator text
<Text UNSAFE_style={{ color: 'white', fontSize: '12px' }}>
    Custom Demo Text
</Text>
```

## 📱 Responsive Behavior

### **Desktop (>768px):**
- Full horizontal layout
- All navigation items visible
- Proper spacing between elements

### **Tablet (768px - 480px):**
- Navigation may wrap to multiple lines
- Maintains readability and usability
- Consistent button sizing

### **Mobile (<480px):**
- Compact layout
- Navigation wraps as needed
- Touch-friendly button sizes

## 🔍 Debugging & Development

### **Common Issues:**
1. **Navigation not working:** Check `useNavigate` hook and route configuration
2. **Demo mode not showing:** Verify `ENABLE_DEMO_MODE` import and value
3. **User email not displaying:** Check `viewProps.imsProfile.email` structure

### **Development Tips:**
- Use browser dev tools to inspect component structure
- Check React Spectrum documentation for component props
- Test responsive behavior at different screen sizes
- Verify accessibility with screen readers

## 📚 Related Documentation

- [React Spectrum Components](https://react-spectrum.adobe.com/react-spectrum/index.html)
- [Adobe App Builder ViewProps](https://developer.adobe.com/app-builder/docs/guides/developing/developing-apps/)
- [Adobe Design System](https://spectrum.adobe.com/)

---

**Component Status:** ✅ Production Ready  
**Last Updated:** Current  
**Maintainer:** Development Team

