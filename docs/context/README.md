# SpaceFlow — AI Assistant Context

**Purpose:** These files provide working context for AI assistants helping with the SpaceFlow project.

## What's in This Directory

This directory contains **contextual documentation** specifically designed for AI assistants (like GitHub Copilot) to understand the project quickly when you reopen it after moving, renaming, or in future conversations.

### Files:

1. **[project-overview.md](project-overview.md)** — Project identity, purpose, and structure
   - What SpaceFlow is
   - Project evolution (ZigMap26 → SpaceFlow)
   - Use cases and vision
   - File organization
   - Quick start

2. **[architecture-decisions.md](architecture-decisions.md)** — Why the code is structured this way
   - Framework vs patch separation rationale
   - Manifest-driven parameters philosophy
   - State management design
   - Color system (deterministic RNG)
   - Export system strategy
   - All major design decisions explained

3. **[critical-features.md](critical-features.md)** — What must ALWAYS work
   - Priority-ranked features
   - SVG export requirements (#1 priority)
   - Testing protocols
   - Implementation details

4. **[quick-reference.md](quick-reference.md)** — Fast lookup cheat sheet
   - Build commands
   - File locations
   - Keyboard shortcuts
   - Common tasks
   - Troubleshooting

5. **[working-knowledge.md](working-knowledge.md)** — Conventions and patterns
   - Code style guidelines
   - Parameter flow
   - Performance patterns
   - Common pitfalls and solutions
   - Git workflow

## How This Differs From Other Documentation

### User Documentation (`docs/English/`)
- **Audience:** End users and developers
- **Purpose:** Learn how to use features
- **Style:** Tutorial and reference
- **Examples:** User-Manual.md, Documentation.md

### Technical Documentation (`docs/English/`)
- **Audience:** Developers implementing features
- **Purpose:** Understand architecture deeply
- **Style:** In-depth analysis and specifications
- **Examples:** SPACEFLOW-ARCHITECTURE.md, PATCH-SYSTEM.md

### AI Context Documentation (`docs/context/` — this directory)
- **Audience:** AI assistants
- **Purpose:** Quick project orientation and working knowledge
- **Style:** Concise, contextual, decision-focused
- **Examples:** All files in this directory

## When to Update These Files

**Update when:**
- Adding major features
- Making architectural decisions
- Changing build workflow
- Adding keyboard shortcuts
- Discovering common pitfalls

**Don't update for:**
- Minor bug fixes
- Small parameter tweaks
- Documentation typo fixes

**Maintenance frequency:** Every few months or after major milestones

## Why These Files Exist

When you move/rename the SpaceFlow project, these files travel with it. When an AI assistant opens the project in a future conversation:

1. It reads these context files first
2. Understands the project immediately
3. Knows what matters most (SVG export priority)
4. Follows your conventions
5. Executes common tasks without asking questions

**Result:** More productive conversations, fewer repetitive explanations.

## File Size Stats

- project-overview.md: ~5 KB
- architecture-decisions.md: ~7 KB
- critical-features.md: ~7 KB
- quick-reference.md: ~9 KB
- working-knowledge.md: ~14 KB

**Total: ~42 KB** of compact, high-value context

## Relationship to Existing Docs

These files **complement** (not replace) your excellent existing documentation:

```
docs/
├── English/
│   ├── README.md                        ← User: Getting started
│   ├── User-Manual.md                   ← User: Complete UI guide
│   ├── Documentation.md                 ← Dev: Technical reference
│   ├── SPACEFLOW-ARCHITECTURE.md        ← Dev: Architecture deep-dive
│   ├── PATCH-SYSTEM.md                  ← Dev: Patch interface spec
│   ├── MIGRATION-STRATEGY.md            ← Dev: Implementation roadmap
│   └── [other technical docs...]
├── French/
│   └── [French translations...]
└── context/                             ← AI: Quick orientation
    ├── README.md (this file)
    ├── project-overview.md
    ├── architecture-decisions.md
    ├── critical-features.md
    ├── quick-reference.md
    └── working-knowledge.md
```

**Think of it as:**
- Existing docs = Comprehensive manual
- Context docs = Cliff notes for AI assistants

---

**Created:** May 29, 2026  
**Status:** Complete and ready to travel with the project
