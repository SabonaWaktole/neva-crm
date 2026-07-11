import React from 'react';
import { Check } from 'lucide-react';
import styles from './Stepper.module.css';

export interface Step {
  id: string | number;
  label: string;
}

export interface StepperProps {
  steps: Step[];
  currentStep: number; // 1-indexed
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep }) => {
  const totalSteps = steps.length;
  // Calculate progress percentage, e.g. 0% for step 1, 50% for step 2 of 3, etc.
  const progressPercent = totalSteps > 1 ? ((currentStep - 1) / (totalSteps - 1)) * 100 : 0;

  return (
    <div className={styles.stepperContainer}>
      <div className={styles.lineBackground} />
      <div 
        className={styles.lineProgress} 
        style={{ width: `${Math.min(Math.max(progressPercent, 0), 100)}%` }} 
      />

      {steps.map((step, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;
        const isFuture = stepNum > currentStep;

        const circleClass = isCompleted 
          ? styles.stepCircleCompleted 
          : isActive 
            ? styles.stepCircleActive 
            : styles.stepCircleFuture;
            
        const labelClass = isCompleted 
          ? styles.stepLabelCompleted 
          : isActive 
            ? styles.stepLabelActive 
            : styles.stepLabelFuture;

        return (
          <div key={step.id} className={styles.stepWrapper}>
            <div className={`${styles.stepCircle} ${circleClass}`}>
              {isCompleted ? (
                <Check size={18} />
              ) : (
                stepNum
              )}
            </div>
            <span className={`${styles.stepLabel} ${labelClass}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
