import type { AsanaVariantContent } from "../domain.js";

export const FIXTURE_ASANA_VARIANTS: Record<string, AsanaVariantContent> = {
  "trikonasana-ashtanga": {
    asana: { sanskritName: "Trikonasana" },
    variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
    poseData: {
      bones: {
        root: { x: 0, y: 0, rotation: 0 },
        head: { x: 0, y: -30, rotation: -0.1 },
        upperArmL: { x: -20, y: -10, rotation: -1.4 },
        upperArmR: { x: 20, y: -10, rotation: 1.4 },
        forearmL: { x: 0, y: 20, rotation: 0 },
        forearmR: { x: 0, y: 20, rotation: 0 },
        thighL: { x: -10, y: 10, rotation: 0.2 },
        thighR: { x: 10, y: 10, rotation: -0.2 },
        shinL: { x: 0, y: 20, rotation: 0 },
        shinR: { x: 0, y: 20, rotation: 0 },
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
    rotationAnnotations: [],
    groundContactAnnotations: [
      { point: "heelL" },
      { point: "heelR" },
      { point: "ballOfFootL" },
      { point: "ballOfFootR" },
    ],
    loadAnnotations: [],
    bodyContactAnnotations: [],
    drishtiAnnotation: { point: "hand" },
  },
  "adho-mukha-svanasana-ashtanga": {
    asana: { sanskritName: "Adho Mukha Svanasana" },
    variant: { tradition: "ashtanga", ashtangaSeries: 1, label: "standard" },
    poseData: {
      bones: {
        root: { x: 0, y: 0, rotation: 0 },
        head: { x: 0, y: -30, rotation: 0 },
        upperArmL: { x: -20, y: -10, rotation: 0.1 },
        upperArmR: { x: 20, y: -10, rotation: -0.1 },
        forearmL: { x: 0, y: 20, rotation: 0 },
        forearmR: { x: 0, y: 20, rotation: 0 },
        thighL: { x: -10, y: 10, rotation: -0.3 },
        thighR: { x: 10, y: 10, rotation: 0.3 },
        shinL: { x: 0, y: 20, rotation: 0 },
        shinR: { x: 0, y: 20, rotation: 0 },
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
    rotationAnnotations: [],
    groundContactAnnotations: [
      { point: "palmL" },
      { point: "palmR" },
      { point: "ballOfFootL" },
      { point: "ballOfFootR" },
    ],
    loadAnnotations: [],
    bodyContactAnnotations: [],
    drishtiAnnotation: { point: "navel" },
  },
};
