# Yoga Anatomy Self-Study Tool

A self-study tool for yoga students practising without a teacher present. It teaches functional anatomy and technique by pairing each asana with an anatomically-annotated model figure and, in a second stage, comparing it against a figure derived from the student's own photograph.

## Language

**Asana**:
The tradition-agnostic posture being studied, identified by its Sanskrit name (e.g. "Trikonasana"). An Asana is a browsing/search concept; it has no geometry or muscle data of its own — those belong to its Asana Variants.
_Avoid_: pose, posture (as the catalog entry — "pose" is reserved for a specific body configuration; "posture" reads as a generic, possibly correct/incorrect body configuration rather than the specific traditional asana being catalogued)

**Asana Variant**:
One independently-authored expression of an Asana, tagged by tradition and, where applicable, an Ashtanga series position — its own model photos, Rig pose, and Muscle Annotations. Ashtanga Variants are authored first; other traditions and non-canonical simplified Variants (each identified by a label) follow as later additions, never as derived overrides of the Ashtanga Variant.
_Avoid_: pose version, style, posture variant

**Model Figure**:
The rendering of an Asana Variant: its authored Pose Data applied to the shared Rig, carrying Muscle Annotations for every muscle in the Muscle Atlas.
_Avoid_: reference figure, demo figure, expert figure

**Student Figure**:
The rendering of Pose Data derived at runtime from the student's own photograph, applied to the same shared Rig as the corresponding Model Figure. The non-judgment principle (see Difference Callout) applies to everything on the student's side of this comparison — never to the Model Figure, which is free to be an authoritative, fully-annotated teaching figure.
_Avoid_: user figure, self figure, practice figure

**Rig**:
The joint/limb structure shared by every Model Figure and Student Figure. It defines what can move, not how it's currently posed — that's Pose Data.
_Avoid_: skeleton (reserved for the Skeleton Layer)

**Pose Data**:
The specific bone-transform values — one rotation/position per Rig bone — that configure the Rig into one exact body configuration. An Asana Variant's Model Figure is rendered from its authored Pose Data; a Student Figure is rendered from Pose Data derived from the detector's reading of the student's photo. This is the source of truth for what a pose *is*: not the model photos, not the student's photo, not any rendered image — those are all either inputs to, or renderings of, Pose Data. A bone missing from Pose Data is never equivalent to a neutral/zero reading for that bone: on a Student Figure it means the detector has no way to measure that bone at all and it must never be treated as a real comparison point; on a Model Figure it means the anatomist reviewed that region and judged it not meaningfully engaged, not that it went unchecked (see ADR-0007).
_Avoid_: pose json, keyframe, pose file

**Muscle Atlas**:
The canonical, reusable library of vector muscle-group shapes, each bound to specific Rig limb segments, authored once and reused across every asana.
_Avoid_: muscle map, muscle library

**Muscle State**:
One of four labels assigned to a muscle on a Model Figure: _Working_ (producing the asana's main effort), _Lengthening_ (being stretched, actively or passively), _Shortened_ (contracted but not the featured effort), or _Neutral_ (not notably involved, left uncolored).
_Avoid_: muscle status, engagement level, contraction type

**Muscle Structure and Function**:
The literature-sourced definition of one muscle in the Muscle Atlas: its Rig attachment points (structure) and its standard joint actions (function). Authored once per muscle, not per Asana Variant, and used to estimate that muscle's Muscle State on any given Model Figure.
_Avoid_: muscle action profile, muscle data, muscle reference, muscle profile

**Muscle Annotation**:
The Muscle State plus a one-sentence role description for one muscle on one Asana Variant's Model Figure. Authored by a human anatomy expert using the muscle's Muscle Structure and Function as reference — not automatically generated (see ADR-0001 for the phased plan toward an automated Muscle State estimator).
_Avoid_: muscle metadata, muscle content

**Rotation Annotation**:
A hand-authored note that a specific Rig bone is meaningfully rotated along its own length on a Model Figure — internal or external rotation for a limb bone (hip or shoulder), left or right for torso rotation. Exists because the Rig is 2D and cannot visually represent axial rotation at all; the annotation drives a curved-arrow overlay rather than any change to the bone's own Pose Data. Authored only where the rotation is a real teaching point, not on every Variant.
_Avoid_: twist annotation, rotation marker

**Ground Contact Annotation**:
A hand-authored note that a specific Contact Point touches the floor on a Model Figure. Distinct from Load Annotation: touching and bearing weight are not the same thing.
_Avoid_: floor contact, touch point

**Load Annotation**:
A hand-authored note of how much of the body's weight a specific Contact Point carries on a Model Figure, as a 0–1 fraction. Authored only where weight distribution is itself a teaching or safety point (e.g. "root down through your forearms, not your neck" in an inversion) — most Variants have none. A Contact Point missing a Load Annotation means its share of the load hasn't been assessed, never that it's zero; an explicit zero must be authored, the same rule Pose Data follows for unmeasured bones.
_Avoid_: weight annotation, load percentage

**Body Contact Annotation**:
A hand-authored note that two Contact Points on the same Model Figure touch each other — a grasp, touch, hook, or press — for poses defined by one part of the body holding or meeting another rather than by contact with the floor (e.g. a hand grasping the opposite wrist in a bound twist, or hands hooking together behind the back). Distinct from Ground Contact Annotation, which is always body-to-floor, never body-to-body.
_Avoid_: bind annotation, grip annotation

**Contact Point**:
One of a fixed set of named places on the body — independent of the Rig's bone names, since the Rig has no hand or foot bones and several contact points (crown of the head, sit bones, ball of the foot) are finer-grained than any single Rig bone. Used by both Ground Contact Annotation (touching the floor) and Body Contact Annotation (touching another point on the same body).

**Drishti Annotation**:
A hand-authored note of the one prescribed gaze point for a Model Figure, drawn from the nine traditional drishti (nose tip, third eye, navel, hand, toes, far right, far left, thumbs, upward). Not detectable from a photo — pupil direction isn't something a joint detector, or even the eye-corner landmarks it discards, can determine — so this is authored the same way Muscle Annotations are, by a human familiar with the tradition's prescribed gaze for that Variant. At most one per Model Figure, unlike the other annotation types, since a pose has exactly one gaze, not several.
_Avoid_: gaze annotation, focal point
_Avoid_: contact bone, touch point

**Model Photo**:
A photo of a practitioner in an Asana Variant, supplied to derive that Variant's Pose Data. A transient input, not a stored asset: never displayed in the product, never persisted, and discarded once Pose Data has been extracted (see ADR-0006).
_Avoid_: model figure (a different concept — the rendered figure, not the photo), reference photo, source photo

**Vinyasa Krama**:
An Ashtanga Asana Variant's authored entrance: an ordered sequence of counted positions, each synchronized to one inhale or exhale, building from a starting position (e.g. Samasthiti) into the held asana. Scoped to Ashtanga Variants only — codified numbered vinyasa counts are an Ashtanga-lineage convention. Despite the shared root, this is distinct from the Vinyasa tradition tag an Asana Variant can carry (see Asana Variant): that tradition is loosely and individually sequenced by each teacher, with no single fixed, canonical entrance per pose, so a Vinyasa Krama is never associated with a Vinyasa-tradition Variant.
_Avoid_: entrance, vinyasa sequence (imprecise on its own — pair "vinyasa" with "krama" to keep this distinct from the tradition), pose sequence

**Count**:
One position within a Vinyasa Krama: a single Pose Data snapshot paired with which breath, inhale or exhale, it belongs to.
_Avoid_: keyframe, step, frame

**Layer**:
A togglable visual overlay on a figure — Muscle Layer, Skeleton Layer, Chakra Layer, etc. Layers stack; the student can show several at once, with the Muscle Layer on by default.
_Avoid_: view, mode

**Difference Callout**:
A named difference between a Student Figure and its Model Figure. Always phrased in geometric/positional terms about body parts (e.g. "front knee straighter"), never in muscle-engagement or corrective language. The non-judgment principle this embodies applies only to the student's side of the comparison — see Student Figure.
_Avoid_: correction, error, mistake, feedback
