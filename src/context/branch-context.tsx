import React, { useState, useEffect, useContext, useCallback, createContext } from 'react';

import { useBranches } from 'src/query';
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
  const [selectedBranchId, setSelectedBranchId] = useState<string>(() => localStorage.getItem('selectedBranchId') || '');

  const { data: queryBranches = [], isLoading: isQueryLoading, refetch } = useBranches();
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [isManualLoading, setIsManualLoading] = useState<boolean>(false);

  useEffect(() => {
    if (queryBranches && queryBranches.length > 0) {
      setBranches(queryBranches);
    }
  }, [queryBranches]);

  const fetchBranches = useCallback(async () => {
    try {
      setIsManualLoading(true);
      const res = await refetch();
      if (res?.data && res.data.length > 0) {
        setBranches(res.data);
      } else {
        const directRes = await api.get('/branches', { isActive: true });
        if (directRes?.data) {
          setBranches(directRes.data);
        }
      }
    } catch {
      // Handled silently
    } finally {
      setIsManualLoading(false);
    }
  }, [refetch]);

  useEffect(() => {
    if (user && branches.length === 0) {
      fetchBranches();
    }
  }, [user, branches.length, fetchBranches]);

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
        isLoading: isQueryLoading || isManualLoading,
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
