# Client Module

This folder contains all client-specific screens, components, and features for the React Native application.

## 📁 Folder Structure

```
src/client/
├── screens/           # Client-specific screens
├── components/        # Client-specific components
├── features/          # Client-specific features/logic
├── index.ts          # Main exports
└── README.md         # This file
```

## 🖥️ Screens

### Main Screens
- **ProjectListScreen** - Main project listing for clients
- **ProjectTaskListScreen** - Task list within a project
- **TaskDetailsScreen** - Individual task details view
- **NotificationsScreen** - Client notifications center

### Profile & Settings
- **ProfileScreen** - Client profile management
- **MyProfileScreen** - Extended profile features
- **ChangePasswordScreen** - Password change functionality
- **FAQScreen** - Frequently asked questions

## 🔧 Components

Client-specific reusable components (to be added as needed).

## ⚡ Features

Client-specific business logic and features (to be added as needed).

## 📦 Usage

Import client screens from the main index:

```typescript
import { 
  ProjectListScreen, 
  NotificationsScreen, 
  ProfileScreen 
} from '../client';
```

## 🎨 Design System

All client screens follow a consistent design system:
- **Color Scheme**: Blue-based theme (#007baf, #073B61)
- **Navigation**: Bottom tab navigation
- **Components**: Shared components from `src/component/`
- **Styling**: Consistent StyleSheet patterns

## 🔄 Updates

- ✅ Removed duplicate files
- ✅ Organized into logical folders
- ✅ Created index exports
- ✅ Added documentation
