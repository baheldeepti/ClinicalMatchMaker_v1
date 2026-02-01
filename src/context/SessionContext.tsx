import { createContext, useContext, useState, ReactNode } from 'react';
import type { PatientProfile, PipelineResult } from '../../lib/schemas';

// ============================================================================
// Types
// ============================================================================

interface SessionContextType {
  patientProfile: PatientProfile | null;
  pipelineResults: PipelineResult | null;
  setPatientProfile: (profile: PatientProfile | null) => void;
  setPipelineResults: (results: PipelineResult | null) => void;
  clearSession: () => void;
}

// ============================================================================
// Context
// ============================================================================

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [patientProfile, setPatientProfile] = useState<PatientProfile | null>(null);
  const [pipelineResults, setPipelineResults] = useState<PipelineResult | null>(null);

  const clearSession = () => {
    setPatientProfile(null);
    setPipelineResults(null);
  };

  const value: SessionContextType = {
    patientProfile,
    pipelineResults,
    setPatientProfile,
    setPipelineResults,
    clearSession,
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);

  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }

  return context;
}
