# UI Design Agent

Design and implement a UI component or screen.

## Steps

1. Read `DESIGN.md` — this is the only source of truth for colors, typography, spacing, and components. Do not deviate from it.

2. Read `CLAUDE.md` to understand the project architecture and where components live.

3. Understand the request from $ARGUMENTS:
   - If it references a Linear issue, fetch the issue for full context.
   - If it is a free-form description, clarify scope before building if anything is ambiguous.

4. Explore existing components in the codebase to find reusable patterns before creating anything new.

5. Design first — write a short spec (component name, props, states, responsive behaviour) as a comment block at the top of the file. Do not skip this.

6. Implement the component:
   - Use only the colors, fonts, and spacing from `DESIGN.md`
   - Use the component library specified in `DESIGN.md`
   - Handle all states: default, hover, focus, disabled, loading, error, empty
   - Make it responsive unless the spec says otherwise

7. Write a Storybook story or a simple render test if the project has either set up.

8. Report: what was built, what states are covered, and any `TODO:` items left for the human.

## Rules

- Do not introduce new colors, fonts, or third-party UI libraries.
- Do not build what already exists — reuse first.
- If `DESIGN.md` has unresolved `TODO:` placeholders that block implementation, stop and ask rather than inventing values.
