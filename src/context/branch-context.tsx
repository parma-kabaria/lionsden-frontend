import React, { useState, useEffect, useContext, useCallback, createContext } from 'react';

import { api } from 'src/api/api-client';

import { useAuth } from 'src/auth/auth-context';

export type BranchItem = {
  _id: string;
  name: string;
  code: string;
  type?: string;
  city: string;
  state?: string;
  isActive: boolean;
};

type BranchContextType = {
  branches: BranchItem[];
  selectedBranchId: string; // '' means all branches (Super Admin)
  setSelectedBranchId: (id: string) => void;
  selectedBranch: BranchItem | null;
  isLoading: boolean;
  refetchBranches: () => Promise<void>;
};

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => localStorage.getItem('selectedBranchId') || '');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchBranches = useCallback(async () => {
    if (!localStorage.getItem('accessToken')) return;

    try {
      setIsLoading(true);
      const res = await api.get('/branches', { isActive: true });
      if (res?.data) {
        setBranches(res.data);
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  // Set default branch according to user's assigned branch
  useEffect(() => {
    if (user && user.branch?._id) {
      setSelectedBranchId(user.branch._id);
      localStorage.setItem('selectedBranchId', user.branch._id);
    }
  }, [user]);

  const handleSelectBranch = (id: string) => {
    setSelectedBranchId(id);
    localStorage.setItem('selectedBranchId', id);
  };

  const selectedBranch = branches.find(b => b._id === selectedBranchId) || null;

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId: handleSelectBranch,
        selectedBranch,
        isLoading,
        refetchBranches: fetchBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}
