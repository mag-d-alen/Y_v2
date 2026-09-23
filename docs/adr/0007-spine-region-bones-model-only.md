# Spine-region Rig bones: coarse, hand-authored for Model Figures only, never populated for Student Figures

Yoga teaching value depends on knowing which section of the back is bending, but no mainstream 2D joint detector (BlazePose included) exposes spine keypoints, and Pose Data is 2D per ADR-0003, so real per-region curvature isn't extractable from an automated detector for either figure. We split the single `torso` Rig bone into `pelvis`, `lowerBack`, and `upperBack`. For Model Figures, an anatomist hand-poses these three in the DragonBones editor against the Model Photo; the automated draft never touches them, so a value only ever appears there via deliberate human action, prompted by an explicit "spine curvature present in this Variant?" check at submission time rather than left to be noticed or missed on a single visual pass. Student Figures never populate these three bones at all — nothing in the unattended, live student-detection pipeline can produce them — so Difference Callout logic must treat `pelvis`/`lowerBack`/`upperBack` as outside student-observable capability by design, never comparing on them, regardless of what's present in the data at runtime.

## Considered options

- **3D mesh-recovery model (e.g. SMPL-style) for Student detection too**, to give both figures matching fidelity. Rejected: doesn't reach vertebra-level precision either, requires Pose Data to grow a z-axis (reopening ADR-0003's 2D DragonBones choice), and gates the entire feature on a heavy pipeline existing in production before any of it can ship.
- **Defer spine-region detail entirely.** Rejected: without it, the core teaching comparison for backbend/forward-fold asanas can't distinguish the one thing that matters most — which region is doing the work.

## Consequences

Model and Student Figures now have a permanent fidelity asymmetry: the Model Figure can show real spine detail, the Student-side comparison can never speak to it unless a future, much heavier detection pipeline is built. Any future spine-region Difference Callout must be gated on this being a Model-only capability, not on checking whether the Student's `PoseData.bones` happens to include those keys.
