# Deletion Confirmation Pattern Design

**Date:** 2026-05-11  
**Scope:** Add confirmation dialog to all destructive actions, starting with category deletion

## Problem

Currently, users can delete categories without any confirmation. This allows accidental deletion of important data with a single click. The issue should extend to all destructive actions in the app (transactions, budgets, etc.).

## Solution Overview

Create a reusable `<ConfirmButton>` component that wraps destructive actions and requires explicit user confirmation before proceeding. The component manages its own state, transitioning between default (icon button) and confirmation (text buttons) states.

## Architecture

### Component Structure

**File:** `packages/frontend/src/components/ConfirmButton.tsx`

The `<ConfirmButton>` component:
- Accepts an icon component, label, confirmation message, and async callback
- Manages internal state: `isConfirming` (boolean) and `error` (string | null)
- Renders differently based on state:
  - **Default**: Icon button with hover styling
  - **Confirming**: Inline text buttons ("Cancel" + "Delete") with confirmation message
- Handles click events:
  - Icon click: Toggle to confirmation state
  - Cancel click: Return to default state
  - Delete click: Execute `onConfirm()`, disable buttons, stay in confirmation state until complete
  - Escape key: Return to default state
- On error: Display error message, keep confirmation state visible for retry
- On success: Return to default state

### Props

```typescript
interface ConfirmButtonProps {
  icon: React.ComponentType<{ size: number }>;
  iconLabel: string;
  onConfirm: () => Promise<void>;
  confirmMessage?: string;
  confirmText?: string;
  isDangerous?: boolean;
  className?: string;
}
```

- `icon`: Lucide React icon component (e.g., `Trash2`)
- `iconLabel`: Aria label for the icon button
- `onConfirm`: Async function to execute on confirmation
- `confirmMessage`: Message shown in confirmation state (default: "Are you sure?")
- `confirmText`: Button text for confirm action (default: "Confirm")
- `isDangerous`: If true, uses red styling for the confirm button (default: true)
- `className`: Additional CSS classes for the icon button

### Integration with CategoriesPage

Replace the delete button (currently lines 138-144 in CategoriesPage.tsx) with:

```tsx
<ConfirmButton
  icon={Trash2}
  iconLabel="Delete"
  onConfirm={async () => {
    await deleteCategory(cat.id);
    setCats((prev) => prev.filter((c) => c.id !== cat.id));
  }}
  confirmMessage="Delete this category?"
/>
```

Remove the `handleDelete` function as it's no longer needed.

## Styling

The component inherits the app's existing design system:
- Icon button: Matches current delete button styling (red background, white icon, hover effects)
- Confirmation buttons: 
  - Cancel: Gray border button (secondary style)
  - Delete: Red background button (dangerous style)
- Error message: Red text below the buttons
- All elements respect dark mode via Tailwind dark: classes

## Error Handling

If `onConfirm()` throws an error:
1. Catch the error and display it as a red error message
2. Keep buttons enabled so user can retry
3. Remain in confirmation state (don't return to icon button)
4. User can still press Escape or click Cancel to dismiss

## Testing Strategy

- **Unit tests**: Render component, verify state transitions (default → confirming → default)
- **Integration test**: Use in CategoriesPage, verify deletion works end-to-end
- **Edge cases**: Error handling, escape key, clicking outside, rapid clicks

## Future Usage (Documented in AGENTS.md)

This component should be used for any destructive action in the app:
- Delete transactions
- Delete budgets
- Clear all data
- Archive accounts
- Reset settings

## Implementation Timeline

1. Create `ConfirmButton.tsx` component
2. Update `CategoriesPage.tsx` to use `ConfirmButton`
3. Remove `handleDelete` function from CategoriesPage
4. Update AGENTS.md with usage guidelines
5. Test in browser
6. Commit and prepare for review
