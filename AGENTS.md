# Agent Rules (React Native + TypeScript)

## Core Principle

This project follows a clean, scalable, and reusable component architecture.
Code must be consistent, type-safe, and maintainable.

---

## 1. Project Structure

- UI primitives → src/components/ui/
- Layout components → src/components/layout/
- Screens → src/screens/
- Theme / tokens → src/theme/

Do not place reusable components inside screens.

---

## 2. Component Rules

- Prefer small, reusable components.
- Extract repeated UI immediately.
- Prefer composition over duplication.
- Screens must remain thin (no heavy UI logic).

If a UI pattern appears more than once, extract it.

---

## 3. TypeScript Rules

- Strict TypeScript only.
- No `any`.
- Define explicit interfaces for component props.
- Use typed constants when possible.
- Avoid unnecessary generics.

All components must have properly typed props.

---

## 4. Styling Rules

- Use `StyleSheet.create`.
- No magic numbers.
- No large inline style objects.
- Keep styles close to the component.
- Separate layout styles from logic.

---

## 5. State Handling

Every screen should consider:

- loading state
- empty state
- error state

Do not ignore UI states.

---

## 6. Clean Code

- No dead code.
- No console.logs in production-ready files.
- Keep components under reasonable size.
- Keep logic separated from UI when possible.

---

## 7. Performance

- Avoid unnecessary re-renders.
- Use React.memo only when justified.
- Avoid deeply nested components.
- Do not prematurely optimize.

---

## 8. Git Discipline

After modifying files:

1. Stage only relevant files.
2. Use Conventional Commit format.
3. Do not commit secrets or environment files.
