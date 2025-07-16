# Notification System

A comprehensive notification system for the Zensor Portal UI that provides user-friendly feedback for various operations.

## Features

- ✅ **Multiple Types**: Success (green), Error (red), Warning (yellow)
- ✅ **Auto-dismiss**: Notifications automatically disappear after a few seconds
- ✅ **Hover to Pause**: Auto-dismiss pauses when user hovers over notification
- ✅ **Manual Close**: Users can manually close notifications
- ✅ **Smooth Animations**: Elegant slide-in and fade-out animations
- ✅ **Mobile Responsive**: Optimized for all screen sizes
- ✅ **Stacking**: Multiple notifications stack vertically
- ✅ **Customizable**: Configurable duration and persistence options
- ✅ **Accessibility**: Proper ARIA labels and keyboard navigation

## Quick Start

### 1. Basic Usage

```jsx
import { useNotification } from '../hooks/useNotification';

const MyComponent = () => {
  const { showSuccess, showError, showWarning } = useNotification();

  const handleSuccess = () => {
    showSuccess('Operation completed successfully!');
  };

  const handleError = () => {
    showError('Something went wrong!', 'Error Title');
  };

  const handleWarning = () => {
    showWarning('Please check your input');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
    </div>
  );
};
```

### 2. API Integration

```jsx
const { showApiNotification } = useNotification();

const handleApiCall = async () => {
  const result = await showApiNotification(
    apiCall(), // Your API promise
    'Data saved successfully!', // Success message
    'Failed to save data', // Error message
    'Success', // Success title (optional)
    'Error' // Error title (optional)
  );

  if (result.success) {
    // Handle success
  } else {
    // Handle error
  }
};
```

### 3. Custom Notifications

```jsx
const { showNotification } = useNotification();

const handleCustom = () => {
  showNotification({
    type: 'success', // 'success', 'error', 'warning'
    title: 'Custom Title',
    message: 'Custom message with longer duration',
    duration: 10000, // 10 seconds
    autoHide: false // Won't auto-hide
  });
};
```

## API Reference

### useNotification Hook

Returns an object with the following methods:

#### `showSuccess(message, title?, options?)`
- **message** (string): The notification message
- **title** (string, optional): The notification title
- **options** (object, optional): Additional options
  - `duration` (number): Auto-dismiss time in milliseconds (default: 4000)
  - `autoHide` (boolean): Whether to auto-hide (default: true)

#### `showError(message, title?, options?)`
- Same parameters as `showSuccess`
- Default duration: 6000ms (longer for errors)

#### `showWarning(message, title?, options?)`
- Same parameters as `showSuccess`
- Default duration: 5000ms

#### `showNotification(notification)`
- **notification** (object): Complete notification object
  - `type` (string): 'success', 'error', 'warning'
  - `message` (string): The notification message
  - `title` (string, optional): The notification title
  - `duration` (number, optional): Auto-dismiss time
  - `autoHide` (boolean, optional): Whether to auto-hide

#### `showApiNotification(promise, successMessage, errorMessage, successTitle?, errorTitle?)`
- **promise** (Promise): The API promise to monitor
- **successMessage** (string): Message to show on success
- **errorMessage** (string): Message to show on error
- **successTitle** (string, optional): Success notification title
- **errorTitle** (string, optional): Error notification title
- **Returns**: Promise that resolves to `{ success: boolean, error?: Error }`

## Integration Examples

### 1. Form Submission

```jsx
const handleSubmit = async (formData) => {
  const result = await showApiNotification(
    submitForm(formData),
    'Form submitted successfully!',
    'Failed to submit form. Please try again.',
    'Success',
    'Submission Error'
  );

  if (result.success) {
    // Reset form or redirect
  }
};
```

### 2. Data Loading

```jsx
const loadData = async () => {
  try {
    setLoading(true);
    const data = await fetchData();
    setData(data);
    showSuccess(`Loaded ${data.length} items`);
  } catch (error) {
    showError(`Failed to load data: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### 3. User Actions

```jsx
const handleDelete = async (id) => {
  const result = await showApiNotification(
    deleteItem(id),
    'Item deleted successfully',
    'Failed to delete item',
    'Deleted',
    'Delete Error'
  );

  if (result.success) {
    // Refresh list or update UI
  }
};
```

## Styling

The notification system uses CSS variables that match your existing design system:

```css
:root {
  --color-success: #10b981;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
  --border-radius: 8px;
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### Custom Styling

You can customize the appearance by overriding CSS classes:

```css
.notification.success {
  /* Custom success notification styles */
}

.notification.error {
  /* Custom error notification styles */
}

.notification.warning {
  /* Custom warning notification styles */
}
```

## Accessibility

The notification system includes:

- Proper ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- High contrast mode support
- Reduced motion support for users with vestibular disorders

## Mobile Responsiveness

Notifications automatically adapt to mobile screens:

- Reduced padding and spacing
- Full-width on small screens
- Touch-friendly close buttons
- Optimized typography

## Best Practices

### 1. Use Appropriate Types
- **Success**: For completed operations, successful saves, etc.
- **Error**: For failed operations, network errors, validation errors
- **Warning**: For important information, confirmations, etc.

### 2. Keep Messages Concise
```jsx
// Good
showSuccess('Settings saved');

// Avoid
showSuccess('Your settings have been successfully saved to the database and will be applied immediately');
```

### 3. Use Titles for Context
```jsx
// Good
showError('Connection failed', 'Network Error');

// Avoid
showError('Connection failed');
```

### 4. Handle API Errors Gracefully
```jsx
const handleApiCall = async () => {
  const result = await showApiNotification(
    apiCall(),
    'Operation successful',
    'Please try again later' // User-friendly error message
  );
};
```

### 5. Don't Overuse Notifications
- Avoid showing notifications for every minor action
- Use them for important feedback and errors
- Consider using inline validation for form errors

## Demo

Visit `/notifications-demo` to see all notification types in action and test the features.

## Troubleshooting

### Notifications Not Showing
1. Ensure `NotificationProvider` wraps your app
2. Check that you're using the hook within a component tree
3. Verify the notification container is not hidden by other elements

### Styling Issues
1. Check that CSS variables are defined
2. Ensure notification container has proper z-index
3. Verify mobile styles are loading correctly

### Performance Issues
1. Avoid creating too many notifications simultaneously
2. Use appropriate auto-hide durations
3. Clean up notification state when components unmount 