import { useCallback, useState } from "react";
import { STORAGE_KEYS } from "../../shared/config";

type OnboardingState = {
  completed: boolean;
};

function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return { completed: false };

  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.onboarding);
    if (!raw) return { completed: false };
    return JSON.parse(raw) as OnboardingState;
  } catch {
    return { completed: false };
  }
}

function writeOnboardingState(state: OnboardingState) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.onboarding, JSON.stringify(state));
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
}

export function useOnboardingState() {
  const [showOnboarding, setShowOnboarding] = useState(() => !readOnboardingState().completed);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const completeOnboarding = useCallback(() => {
    writeOnboardingState({ completed: true });
    setShowOnboarding(false);
  }, []);

  const resetOnboarding = useCallback(() => {
    writeOnboardingState({ completed: false });
    setOnboardingStep(1);
    setShowOnboarding(true);
  }, []);

  return {
    showOnboarding,
    onboardingStep,
    setOnboardingStep,
    completeOnboarding,
    resetOnboarding,
  };
}
