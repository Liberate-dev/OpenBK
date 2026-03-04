/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from 'react';

interface AdminLayoutFiltersContextValue {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  dateFilter: string;
  setDateFilter: (value: string) => void;
}

const AdminLayoutFiltersContext = createContext<AdminLayoutFiltersContextValue | null>(null);

export function AdminLayoutFiltersProvider(props: {
  value: AdminLayoutFiltersContextValue;
  children: React.ReactNode;
}) {
  return (
    <AdminLayoutFiltersContext.Provider value={props.value}>
      {props.children}
    </AdminLayoutFiltersContext.Provider>
  );
}

export function useAdminLayoutFilters() {
  const context = useContext(AdminLayoutFiltersContext);
  if (!context) {
    throw new Error('useAdminLayoutFilters must be used inside AdminLayoutFiltersProvider');
  }
  return context;
}
