/** Shared vocabulary for the interactive playground (scene + control panel). */

export type PlaygroundMaterial = "metal" | "glass" | "emissive" | "matte";

export type PartId = "core" | "ring" | "satellites";

export const PLAYGROUND_PARTS: { id: PartId; name: string; spec: string }[] = [
  {
    id: "core",
    name: "Torus-knot core",
    spec: "One continuous knot. Switch the material and this mesh changes for real — metal, glass, emissive and matte are four distinct shading paths.",
  },
  {
    id: "ring",
    name: "Drive ring",
    spec: "Procedurally toothed ring generated from a 2D profile at runtime, then extruded. No mesh file is loaded anywhere in this project.",
  },
  {
    id: "satellites",
    name: "Satellite cluster",
    spec: "Twelve instanced polyhedra travelling independent orbit paths, drawn in a single GPU call.",
  },
];
