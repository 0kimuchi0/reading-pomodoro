```markdown
# reading-pomodoro Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill covers the core development patterns and conventions used in the `reading-pomodoro` repository, a React application written in TypeScript. You'll learn about file naming, import/export styles, commit message conventions, and how to work with and write tests in this codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `pomodoroTimer.tsx`, `readingSession.ts`

### Imports
- Use **relative imports** for modules within the project.
  - Example:
    ```typescript
    import PomodoroTimer from './pomodoroTimer';
    import utils from '../utils/timeUtils';
    ```

### Exports
- Use **default exports** for modules.
  - Example:
    ```typescript
    // In pomodoroTimer.tsx
    const PomodoroTimer = () => { /* ... */ };
    export default PomodoroTimer;
    ```

### Commit Messages
- Commit types are mixed, but commonly use the `chore` prefix.
- Average commit message length is about 60 characters.
  - Example: `chore: update dependencies and fix minor bugs`

## Workflows

### Adding a New Component
**Trigger:** When you need to create a new UI or logic component.
**Command:** `/add-component`

1. Create a new file in the appropriate directory using camelCase (e.g., `newFeatureComponent.tsx`).
2. Write your component using TypeScript and React.
3. Use relative imports for any dependencies.
4. Export the component as default.
5. Add or update tests in a corresponding `*.test.tsx` file.
6. Commit your changes with a descriptive message, prefixed if appropriate (e.g., `chore: add new feature component`).

### Running Tests
**Trigger:** When you want to verify your code changes.
**Command:** `/run-tests`

1. Identify the relevant `*.test.*` files.
2. Use the project's test runner (framework unknown; check `package.json` for scripts).
3. Run the test command (commonly `npm test` or `yarn test`).
4. Review the output and fix any failing tests.

### Refactoring Code
**Trigger:** When improving code structure or readability.
**Command:** `/refactor`

1. Update file and variable names to follow camelCase if needed.
2. Change imports to use relative paths.
3. Ensure all exports are default.
4. Update or add tests if necessary.
5. Commit changes with a descriptive message (e.g., `chore: refactor session logic`).

## Testing Patterns

- Test files follow the pattern `*.test.*` (e.g., `pomodoroTimer.test.tsx`).
- The specific testing framework is unknown, but standard React/TypeScript practices likely apply.
- Place tests alongside or near the component/module being tested.

  Example test file:
  ```typescript
  // pomodoroTimer.test.tsx
  import PomodoroTimer from './pomodoroTimer';

  describe('PomodoroTimer', () => {
    it('should render without crashing', () => {
      // Test implementation here
    });
  });
  ```

## Commands
| Command         | Purpose                                     |
|-----------------|---------------------------------------------|
| /add-component  | Scaffold and add a new component            |
| /run-tests      | Run all tests in the codebase               |
| /refactor       | Refactor code to match conventions          |
```
