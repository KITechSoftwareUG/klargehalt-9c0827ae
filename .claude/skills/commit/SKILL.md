---
description: Stage, commit, and push all changes to GitHub. Use when the user asks to commit, push, or save changes to git.
user-invocable: true
allowed-tools: Bash, Read, Glob
---

1. Run `git status` to see what has changed
2. Run `git diff --stat HEAD` to understand the scope of changes
3. Run `git log --oneline -5` to see recent commits and determine the next version number
4. Stage specific files (prefer naming files over `git add .` to avoid committing secrets):
   `git add <file1> <file2> ...`
5. Commit with the project format:
   - Feature/fix: `git commit -m "Deployment V[version]: [what changed]"`
   - Quality: `git commit -m "Kaizen: [what improved]"`
   - Always append: `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
6. Push: `git push`
7. Confirm success by checking the output for the commit hash on `main`
