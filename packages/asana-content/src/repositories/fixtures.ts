import type { AsanaVariantContent } from "../domain.js";

export const FIXTURE_ASANA_VARIANTS: Record<string, AsanaVariantContent> = {
  "trikonasana-ashtanga": {
    asana: { sanskritName: "Trikonasana" },
    variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
    poseData: {
      bones: {
        root: { x: 0, y: 0, rotation: 0 },
        torso: { x: 0, y: -40, rotation: 0.35 },
        head: { x: 0, y: -30, rotation: -0.1 },
        armL: { x: -20, y: -10, rotation: -1.4 },
        armR: { x: 20, y: -10, rotation: 1.4 },
        legL: { x: -10, y: 10, rotation: 0.2 },
        legR: { x: 10, y: 10, rotation: -0.2 },
      },
    },
    muscleAnnotations: [
      {
        muscleId: "obliques-right",
        state: "working",
        roleDescription: "Contracts to side-bend the torso toward the front leg.",
      },
      {
        muscleId: "hamstrings-left",
        state: "lengthening",
        roleDescription: "Stretches as the front leg straightens and the torso folds over it.",
      },
      {
        muscleId: "quadriceps-right",
        state: "shortened",
        roleDescription: "Shortens to stabilize the bent back leg.",
      },
      {
        muscleId: "biceps-left",
        state: "neutral",
        roleDescription: "Not notably involved in this asana.",
      },
    ],
  },
  "adho-mukha-svanasana-ashtanga": {
    asana: { sanskritName: "Adho Mukha Svanasana" },
    variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
    poseData: {
      bones: {
        root: { x: 0, y: 0, rotation: 0 },
        torso: { x: 0, y: -40, rotation: 0.9 },
        head: { x: 0, y: -30, rotation: 0 },
        armL: { x: -20, y: -10, rotation: 0.1 },
        armR: { x: 20, y: -10, rotation: -0.1 },
        legL: { x: -10, y: 10, rotation: -0.3 },
        legR: { x: 10, y: 10, rotation: 0.3 },
      },
    },
    muscleAnnotations: [
      {
        muscleId: "shoulders",
        state: "working",
        roleDescription: "Stabilizes the arms as they bear weight overhead.",
      },
      {
        muscleId: "calves",
        state: "lengthening",
        roleDescription: "Stretches as the heels press toward the floor.",
      },
    ],
  },
};
