# SwipeableProjectCard Component

## Overview
`SwipeableProjectCard` adalah component baru yang menggantikan `ProjectCardScreen` dengan tambahan fitur swipe gesture untuk quick actions.

## Features

### 🎯 Navigation
- **Tap/Click**: Navigate ke project details (menggunakan `onPress` prop)
- **Swipe Left**: Delete project (button merah)
- **Swipe Right**: Edit/Update project (button biru)

### ✨ Swipe Gestures
- **Swipe Left**: Mendedahkan button delete merah
- **Swipe Right**: Mendedahkan button edit biru
- **Auto-reset**: Card automatik kembali ke posisi tengah selepas action
- **Long Press**: Long press pada card untuk reset position secara manual

### 🎨 Visual Indicators
- Action buttons muncul di belakang card dengan smooth animations
- Swipe hints menunjukkan di bawah setiap card bila actions tersedia
- Smooth spring animations untuk rasa yang natural

## Props

```typescript
export type SwipeableProjectCardProps = {
    id: number;                                    // Project ID
    title: string;                                 // Project title
    subtitle?: string | null;                      // Project subtitle
    client_name?: string | null;                   // Client name
    progress?: number;                             // Progress percentage (0-100)
    status?: string;                               // Project status
    start_date?: string | null;                    // Start date
    due_date?: string | null;                      // Due date
    logo_url?: string | null;                      // Logo URL
    total_tasks?: number | null;                   // Total tasks count
    assignees?: Array<{ id: number | string; avatar_url?: string | null }>; // Assignees
    onPress?: () => void;                          // Called when card is tapped
    onDelete?: (id: number) => void;               // Called when delete button is pressed
    onUpdate?: (id: number) => void;               // Called when edit button is pressed
};
```

## Usage Example

```typescript
import SwipeableProjectCard from '../component/SwipeableProjectCard';

// Dalam component
<SwipeableProjectCard
    id={project.id}
    title={project.title}
    subtitle={project.client_name}
    progress={project.progress_percent}
    status={project.status}
    start_date={formatDate(project.start_at)}
    due_date={formatDate(project.due_date)}
    total_tasks={project.total_tasks}
    assignees={assigneesData}
    onPress={() => navigation.navigate('ProjectDetails', { projectId: project.id })}
    onDelete={(id) => {
        // Handle project deletion
        console.log('Deleting project:', id);
        // Your delete logic here
    }}
    onUpdate={(id) => {
        // Handle project update
        console.log('Updating project:', id);
        // Your update logic here
    }}
/>
```

## Implementation Details

### Dependencies
- `react-native-gesture-handler` untuk swipe detection
- `react-native` Animated API untuk smooth animations

### Swipe Threshold
- **SWIPE_THRESHOLD**: 80px - minimum distance untuk trigger action
- Cards snap ke threshold position bila swipe cukup jauh
- Spring animations provide smooth return ke center

### Action Buttons
- **Delete Button**: Button bulat merah dengan trash icon
- **Edit Button**: Button bulat biru dengan edit icon
- Buttons positioned absolutely di belakang card
- Hanya visible bila swipe beyond threshold

## Styling
- Action buttons menggunakan shadow dan elevation untuk depth
- Smooth color transitions dan hover effects
- Responsive design yang bekerja pada different screen sizes

## Accessibility
- Touch targets appropriately sized (60x60px)
- Clear visual feedback untuk actions
- Swipe hints provide user guidance

## Migration from ProjectCardScreen

Untuk migrate dari `ProjectCardScreen` ke `SwipeableProjectCard`:

1. **Import**: Tukar import statement
2. **Props**: Tambah `onDelete` dan `onUpdate` props
3. **Functionality**: Implement delete dan update logic dalam props tersebut

## Notes
- Component ini backward compatible dengan existing `ProjectCardScreen` props
- Swipe functionality hanya active bila `onDelete` atau `onUpdate` props provided
- Long press gesture boleh digunakan untuk reset card position
