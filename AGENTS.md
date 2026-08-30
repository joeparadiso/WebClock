# Project Rules & Guidelines

## Git Commit Convention
- **Sequential 3-Digit Prefix:** All git commits in this repository MUST start with a 3-digit zero-padded sequential number prefix followed by a colon and a space:
  `XXX: <Commit Title>`

  Examples:
  - `058: ...`
  - `059: Add 1px inner accent frame to main clock, match train & weather typography sizing, and bold component titles`
  - `060: Enhance MBTA commuter rail tracker with outbound route and streamlined layout`
  - `061: <Next Commit Title>`

- **Sequential Number Discovery:** Before creating a commit, always check `git log -n 1` to verify the previous commit number and increment it by 1.

- **Explicit User Request Required:** ONLY create git commits when the user explicitly instructs you to commit. Never proactively commit changes or assume readiness; always allow the user to review, test, and verify the changes first.

## Permission Requests & Task Explanations
- **Comprehensive Context on Approvals:** Whenever requesting the user's permission to execute commands, apply major changes, or proceed with actions:
  - **What:** Clearly state the exact command, file, or action being proposed.
  - **Why:** Explain why this action is necessary and how it fits into the current task.
  - **Impact & Details:** Describe precisely what the code or command does, what changes it introduces, and the expected outcome so the user can easily make an informed decision without needing to research it independently.
