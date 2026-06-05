# MTC Chennai Analytics Portal - Settings Page Documentation

## Overview

A professional, enterprise-grade Settings page has been created for the MTC Chennai Analytics Portal. This page provides comprehensive user profile, preferences, notification, and security management with Firebase integration.

## Features Implemented

### 1. **User Profile Section**
- **Display Information:**
  - Profile Picture placeholder
  - Full Name (editable)
  - Email Address (editable)
  - User Role (read-only badge)
  - Last Login timestamp

- **Actions:**
  - **Edit Profile** button - enables inline editing
  - **Save Changes** button - persists profile updates to Firestore
  - **Cancel** button - discards changes

- **Data Persistence:**
  - Profile data stored in Firestore under `users/{uid}/profile`
  - Real-time synchronization with Firebase Auth

### 2. **Appearance Settings**
- **Theme Options:**
  - Dark Mode (default)
  - Light Mode
  - Active selection highlighted with accent color

- **Dashboard Preferences:**
  - Default Bus Type: Ordinary, AC, or All
  - Default Dashboard View: Executive, Operations, or Depot Performance
  - Dropdown selectors with dark theme styling

- **Persistence:**
  - Preferences stored in Firestore under `users/{uid}/preferences`
  - Auto-saved on selection change

### 3. **Notifications Section**
- **Toggle Switches** for:
  - Revenue Alerts
  - Load Factor Alerts
  - Govt Scheme Alerts
  - Email Notifications

- **Features:**
  - Modern toggle switch UI with smooth animations
  - Real-time status indicators (enabled/disabled)
  - Descriptions for each notification type
  - Instant persistence to Firestore

### 4. **Security Section**
- **Change Password Functionality:**
  - Current Password field (with show/hide toggle)
  - New Password field (with show/hide toggle)
  - Confirm Password field (with show/hide toggle)
  - **Update Password** button

- **Security Features:**
  - Firebase re-authentication before password change
  - Password strength validation (minimum 6 characters)
  - Password match confirmation
  - Error handling for incorrect current password
  - Success notification upon password change
  - User remains logged in after password update

- **Validation:**
  - Current password must be correct
  - New password minimum 6 characters
  - Passwords must match
  - Clear error messages for all validation failures

### 5. **User Management (Admin Only)**
- **Visibility:** Only shows for users with role = "Administrator"

- **Features:**
  - View all users in the system
  - Add new users with form
  - User list with:
    - Name
    - Email
    - Role
    - Action buttons: Reset Password, Disable User

- **Add User Form:**
  - Name input field
  - Email input field
  - Role selector (Administrator, AM Revenue, BM, Operator)
  - Add/Cancel buttons

- **Data Storage:**
  - Users stored in Firestore under `users/{email}` collection
  - Profile information persisted with creation timestamp

### 6. **About Section** (Sidebar)
- **Application Information:**
  - Product Name: MTC Chennai Analytics Portal
  - Version: 1.0.0

- **Built With:**
  - React 19
  - Firebase
  - Vercel
  - Recharts

- **Developer:**
  - Lohith

### 7. **Quick Links** (Sidebar)
- Privacy Policy
- Terms of Service
- Documentation

## Design & Styling

### Color Scheme
- **Background:** `#0B1220` (dark navy)
- **Card Background:** `#111827` (slightly lighter dark)
- **Sidebar:** `#0F172A` (sidebar dark)
- **Primary Accent:** `#0EA5E9` (cyan blue)
- **Success:** `#22C55E` (green)
- **Error:** Rose/Red tones
- **Text:** `#E2E8F0` (light gray)
- **Secondary Text:** `#94A3B8` (medium gray)

### UI Components
- **Cards:** Rounded borders with subtle shadows
- **Buttons:**
  - Primary: Accent color with hover effects
  - Secondary: Dark background with border
  - Danger: Red/rose tones
- **Inputs:** Dark backgrounds with accent focus states
- **Toggles:** Modern switch UI with smooth transitions
- **Sections:** Clear visual hierarchy with icons

### Responsive Design
- Mobile-first approach
- Grid layouts that adapt to screen size
- Sidebar navigation for easy access
- Stacked layouts on mobile, side-by-side on desktop

## Integration Points

### 1. **Firebase Authentication**
```typescript
- User authentication via Firebase Auth
- Password change with re-authentication
- Session management
- User UID-based data tracking
```

### 2. **Firestore Database Structure**
```
users/{uid}
├── profile
│   ├── name
│   ├── email
│   ├── role
│   └── lastLogin
├── preferences
│   ├── theme
│   ├── defaultBusType
│   └── defaultView
├── notifications
│   ├── revenueAlerts
│   ├── loadFactorAlerts
│   ├── schemeAlerts
│   └── emailNotifications
└── createdAt
```

### 3. **Route Integration**
- Path: `/settings`
- Protected route (requires authentication)
- Navigation added to Sidebar
- Integrated with existing DashboardShell

## File Structure

```
src/
├── pages/
│   ├── Settings.tsx          (New - Settings page component)
│   ├── MapPage.tsx
│   ├── Executive.tsx
│   └── ...
├── components/
│   ├── Sidebar.tsx           (Updated - Added Settings link)
│   ├── ...
└── App.tsx                   (Updated - Added Settings route)
```

## Notification System

### Toast Notifications
- Success messages (green)
- Error messages (red)
- Auto-dismiss after 4 seconds
- Clear error descriptions

### Messages Include:
- Profile updated successfully
- Preferences saved
- Notification settings updated
- Password changed successfully
- User added successfully
- Various error messages with context

## User Roles & Permissions

### Role-Based Features:
- **Administrator:** Full access including User Management section
- **AM Revenue:** Access to all features except User Management
- **BM:** Access to all features except User Management
- **Operator:** Access to all features except User Management

## Form Validation

### Profile Form:
- Name: Required, non-empty
- Email: Valid email format

### Password Form:
- Current Password: Required, must match Firebase
- New Password: Minimum 6 characters
- Confirm Password: Must match New Password

### User Form (Admin):
- Name: Required
- Email: Required, valid format
- Role: Required selection

## Error Handling

- Try-catch blocks for all Firestore operations
- User-friendly error messages
- Validation before submission
- Clear feedback for failed operations

## Security Features

1. **Password Change:**
   - Requires current password verification
   - Firebase re-authentication
   - Password strength requirements
   - Secure password update

2. **Data Privacy:**
   - User data isolated by UID
   - Firestore security rules enforced
   - No sensitive data in local state

3. **Access Control:**
   - Protected routes via ProtectedRoute component
   - Role-based UI visibility
   - Admin-only sections

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design works on mobile, tablet, desktop
- Uses standard web APIs and frameworks

## Performance Considerations

1. **Firestore Queries:**
   - Efficient user collection queries
   - Single document reads for preferences
   - Merge option for partial updates

2. **UI Optimization:**
   - Component state management
   - Memoization of computed values
   - Smooth transitions and animations

## Future Enhancements

1. Two-factor authentication
2. Profile picture upload
3. API key management
4. Activity logs
5. Privacy settings granularity
6. Bulk user import
7. Permission management UI
8. Dark/Light mode theme editor
9. Export user data feature
10. Session management

## Testing Checklist

- [ ] Login and navigate to Settings
- [ ] Edit profile information
- [ ] Update password successfully
- [ ] Verify error handling for invalid passwords
- [ ] Toggle notification settings
- [ ] Change appearance preferences
- [ ] Test responsive design
- [ ] Admin user can view User Management
- [ ] Admin can add new users
- [ ] Non-admin users cannot see User Management
- [ ] All data persists after refresh
- [ ] Toast notifications display correctly

## Deployment Notes

1. Ensure Firebase project is configured
2. Firestore security rules allow user data access
3. Firebase Auth email/password provider enabled
4. Environment variables set correctly
5. Build succeeds without errors
6. Route `/settings` accessible after authentication

## Support & Maintenance

For issues or enhancements, refer to:
- Firebase documentation for Auth/Firestore
- Component prop documentation in code comments
- Error messages in console for debugging
