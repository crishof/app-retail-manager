# Task Templates

## Bug Fix Template

```markdown
## Bug: [Title]

### Description
[Brief description of the bug]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]

### Expected Behavior
[What should happen]

### Actual Behavior
[What actually happens]

### Location
- File: `path/to/file.java`
- Line: ~123

### Solution
[Proposed fix]

### Testing
- [ ] Verify fix works
- [ ] No regression in related functionality
```

---

## Feature Template

```markdown
## Feature: [Title]

### Description
[Brief description]

### Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Files to Modify
- `backend/...`
- `frontend/...`

### API Changes
```bash
# New endpoint
GET /api/v1/resource
```

### Testing
- [ ] Unit tests
- [ ] Integration test
- [ ] Manual verification
```

---

## Refactor Template

```markdown
## Refactor: [Title]

### Reason
[Why this needs refactoring]

### Scope
- Affected files: `path/to/files`
- Impact: Low/Medium/High

### Approach
[How to refactor safely]

### Testing
- [ ] Build passes
- [ ] Tests pass
- [ ] Manual check
```

---

## Documentation Update

```markdown
## Docs: [Title]

### Files Changed
- `docs/file.md` - [description]

### Changes
- [ ] Added new section
- [ ] Updated existing content
- [ ] Fixed outdated info
```

---

## Quick Check

Before submitting any change:

- [ ] Code compiles
- [ ] No obvious errors
- [ ] Follows project conventions
- [ ] No secrets committed
- [ ] Documentation updated if needed