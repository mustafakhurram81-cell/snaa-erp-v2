import { Hammer, Flame, CircleDot, FileSliders, Thermometer, Sparkles, Wrench, ShieldCheck, PaintBucket, Package } from "lucide-react";

export interface ManufacturingStage {
    id: number;
    key: string;
    name: string;
    icon: string; // lucide icon name
    defaultType: "in-house" | "vendor";
    description: string;
}

export const MANUFACTURING_STAGES: ManufacturingStage[] = [
    { id: 1, key: "die_making", name: "Die Making", icon: "Hammer", defaultType: "vendor", description: "Creating dies and molds for instrument shapes" },
    { id: 2, key: "forging", name: "Forging", icon: "Flame", defaultType: "vendor", description: "Hot/cold forging of raw material into rough shapes" },
    { id: 3, key: "grinding", name: "Grinding", icon: "CircleDot", defaultType: "vendor", description: "Rough and fine grinding to achieve dimensions" },
    { id: 4, key: "filing", name: "Filing", icon: "FileSliders", defaultType: "vendor", description: "Hand filing and finishing of instrument surfaces" },
    { id: 5, key: "heat_treatment", name: "Heat Treatment", icon: "Thermometer", defaultType: "vendor", description: "Hardening and tempering for proper metallurgy" },
    { id: 6, key: "electroplating", name: "Electroplating", icon: "Sparkles", defaultType: "vendor", description: "Satin, mirror, or gold plating finish" },
    { id: 7, key: "assembly", name: "Assembly", icon: "Wrench", defaultType: "in-house", description: "Assembly of multi-part instruments" },
    { id: 8, key: "quality_control", name: "Quality Control", icon: "ShieldCheck", defaultType: "in-house", description: "Dimensional, functional, and visual inspection" },
    { id: 9, key: "finishing", name: "Finishing", icon: "PaintBucket", defaultType: "in-house", description: "Final polishing, laser marking, and engraving" },
    { id: 10, key: "packaging", name: "Packaging", icon: "Package", defaultType: "in-house", description: "Sterilization packaging and labeling" },
];

export type StageStatus = "not_started" | "in_progress" | "completed" | "skipped";
export type StageType = "in-house" | "vendor";

export interface JobStage {
    stageId: number;
    status: StageStatus;
    type: StageType;
    vendor?: string;
    poNumber?: string;
    startDate?: string;
    endDate?: string;
    notes?: string;
}

export function getStageByKey(key: string) {
    return MANUFACTURING_STAGES.find((s) => s.key === key);
}

export function getStageById(id: number) {
    return MANUFACTURING_STAGES.find((s) => s.id === id);
}

export function getCurrentStage(stages: JobStage[]): number {
    const inProgress = stages.find((s) => s.status === "in_progress");
    if (inProgress) return inProgress.stageId;
    const lastCompleted = [...stages].reverse().find((s) => s.status === "completed");
    if (lastCompleted) return Math.min(lastCompleted.stageId + 1, 10);
    return 1;
}

export function getProgress(stages: JobStage[]): number {
    const completed = stages.filter((s) => s.status === "completed" || s.status === "skipped").length;
    return Math.round((completed / MANUFACTURING_STAGES.length) * 100);
}
