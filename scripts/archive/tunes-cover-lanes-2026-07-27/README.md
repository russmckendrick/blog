# Tunes cover lanes snapshot

This directory is an exact pre-refactor snapshot of the Tunes image-generation
scripts and configuration from commit `047e0895` on 27 July 2026.

It preserves:

- the lane-driven Tunes header generator;
- the artist portrait generator and its shared rotation helpers;
- the weekly and manual regeneration entry points;
- the bulk historical-cover entry point;
- image backend, history, policy, blocklist, and configuration dependencies;
- the committed image-generation history at the time of the snapshot.

The original repository-relative paths are retained below this directory. To
roll back, copy the required files from `scripts/` in this snapshot back to the
repository's top-level `scripts/` directory, preserving their relative paths.
The files are intended as a restoration snapshot rather than an independently
runnable copy because their project-root resolution assumes their original
locations.
