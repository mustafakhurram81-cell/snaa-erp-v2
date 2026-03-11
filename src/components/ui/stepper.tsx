import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("flex items-center justify-between w-full relative", className)}>
      {/* Background Line */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5" 
        style={{ background: "var(--border)", zIndex: 0 }} 
      />
      
      {/* Progress Line */}
      <div 
        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 transition-all duration-300 ease-in-out bg-blue-600 dark:bg-blue-500" 
        style={{ 
          width: `${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%`,
          zIndex: 1 
        }} 
      />

      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isPending = index > currentStep;

        return (
          <div key={step} className="relative z-10 flex flex-col items-center group">
            <div 
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                isCompleted ? "bg-blue-600 text-white shadow-sm" : 
                isCurrent ? "bg-blue-600 text-white shadow-md ring-4 ring-blue-600/20" : 
                "bg-[var(--card)] text-[var(--muted-foreground)] border-2 border-[var(--border)]"
              )}
            >
              {isCompleted ? <Check className="w-4 h-4" /> : <span>{index + 1}</span>}
            </div>
            
            {/* Step Label */}
            <div className="absolute top-10 w-32 text-center pointer-events-none">
              <span 
                className={cn(
                  "text-[10px] uppercase tracking-wider font-bold transition-colors duration-300",
                  isCurrent ? "text-blue-600 dark:text-blue-400" : 
                  isCompleted ? "text-[var(--foreground)]" : 
                  "text-[var(--muted-foreground)]"
                )}
              >
                {step}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
