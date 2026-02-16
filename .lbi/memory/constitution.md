# Project Constitution

This document defines the principles, standards, and rules that govern this project.

## Core Principles

### 1. Code Quality

- **SOLID Principles**: Apply Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion
- **Clean Code**: Write self-documenting code with meaningful names
- **DRY**: Don't Repeat Yourself - extract common patterns

### 2. Type Safety

- All functions must have type hints
- Use strict typing where possible
- Avoid `Any` types unless absolutely necessary

### 3. Documentation

- Docstrings required on all public functions
- Use Javadoc/Google style docstrings
- Keep documentation up to date with code

### 4. Testing

- Minimum 80% code coverage
- Write tests before or alongside implementation
- Test edge cases and error conditions

### 5. Version Control

- Descriptive commit messages
- Feature branches for new work
- Pull requests for code review

## Coding Standards

### Python

- Follow PEP 8 style guide
- Maximum line length: 100 characters
- Use Black for formatting
- Use Ruff for linting

### File Organization

- One class per file (with exceptions for small related classes)
- Maximum 300 lines per module
- Group related functionality in packages

## Quality Gates

### Before Commit

- [ ] All tests pass
- [ ] No linter errors
- [ ] Type checking passes
- [ ] Code reviewed

### Before Merge

- [ ] PR approved
- [ ] CI checks pass
- [ ] Documentation updated
- [ ] No merge conflicts

## Workflow

Follow the Spec-Driven Development workflow:

```
/lbi.request → /lbi.specify → /lbi.plan → /lbi.implement → /lbi.tests → /lbi.review → /lbi.push
```

## Exceptions

Document any exceptions to these rules in the relevant spec file with justification.
