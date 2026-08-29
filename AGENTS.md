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
