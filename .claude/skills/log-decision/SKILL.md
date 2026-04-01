---
name: log-decision
description: Add an engineering decision record to DECISION_LOG.md
user_invocable: true
---

# Log Decision

When the user invokes `/log-decision`, prompt them for the decision details and append a new entry to `docs/DECISION_LOG.md`.

## Format

```markdown
---

## YYYY-MM-DD — {Title}

**Решение:** {What was decided}

**Почему:** {Rationale — why this choice over others}

**Альтернативы:**
- {Alternative 1} — {why rejected}
- {Alternative 2} — {why rejected}

**Итог:** {Summary of impact}
```

## Instructions

1. Ask the user: "What decision was made?" if not provided as argument
2. Get today's date
3. Read the current `docs/DECISION_LOG.md`
4. Append the new entry at the end of the file
5. Confirm the entry was added
