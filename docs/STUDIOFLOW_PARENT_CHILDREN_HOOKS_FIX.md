# StudioFlow — ParentChildren Hooks-Order Fix

## Problem

`web-studioflow/src/pages/parent/ParentChildren.tsx` declared two early
returns (loading and empty/error states) **before** several `useState` hooks:

```tsx
if (isLoading) return <ParentLoadingSkeleton lines={5} />;
if (loadState === "empty" || !parent || !primaryContact) return <NoCaregiverFound />;

const [expandedId, setExpandedId] = useState<string | null>(null);
// ...more useState calls
```

When a real account transitioned from `loading` → `empty`/`error` → `loaded`,
the number of hooks executed on each render changed. This violates the React
Rules of Hooks ("React has detected a change in the order of Hooks") and can
corrupt component state.

## Fix

Moved **all** React hooks to the top level of the component, before any
conditional returns. The two early returns now run *after* every `useState`
call. To keep types valid while `primaryContact` may still be `null` during
loading, the primary draft now initialises with a safe fallback:

```tsx
const [primaryDraft, setPrimaryDraft] = useState<FamilyContact>(
  primaryContact ?? emptyContact(),
);
// ...all other hooks declared here...

// Conditional rendering happens after all hooks are declared.
if (isLoading) return <ParentLoadingSkeleton lines={5} />;
if (loadState === "empty" || !parent || !primaryContact) return <NoCaregiverFound />;
```

The loading, empty, error, and demo states are preserved exactly — only the
ordering changed so hooks always run unconditionally.

## Scope

- No changes to parent portal auth, RLS, Supabase query logic, payments, or
  demo isolation.
- Only the hooks-order issue in `ParentChildren.tsx` was addressed.

## Files changed

- `web-studioflow/src/pages/parent/ParentChildren.tsx`

## Validation

- `runChecks` (static checks + `bun run build`) for `web-studioflow`: **passed**.
