import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface ExportRecord {
  id: string
  type: 'csv' | 'excel' | 'google-sheets'
  timestamp: string
  status: 'success' | 'failed' | 'pending'
  fileName?: string
  recordCount: number
  spreadsheetUrl?: string
  error?: string
}

interface ExportHistoryContextType {
  history: ExportRecord[]
  addExport: (record: Omit<ExportRecord, 'id' | 'timestamp'>) => void
  updateExport: (id: string, updates: Partial<ExportRecord>) => void
  clearHistory: () => void
}

const ExportHistoryContext = createContext<ExportHistoryContextType | undefined>(undefined)

const STORAGE_KEY = 'export-history'

export const ExportHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [history, setHistory] = useState<ExportRecord[]>([])

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setHistory(parsed)
      }
    } catch (error) {
      console.error('Failed to load export history:', error)
    }
  }, [])

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (error) {
      console.error('Failed to save export history:', error)
    }
  }, [history])

  const addExport = (record: Omit<ExportRecord, 'id' | 'timestamp'>) => {
    const newRecord: ExportRecord = {
      ...record,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    }

    setHistory(prev => [newRecord, ...prev])
  }

  const updateExport = (id: string, updates: Partial<ExportRecord>) => {
    setHistory(prev =>
      prev.map(record =>
        record.id === id ? { ...record, ...updates } : record
      )
    )
  }

  const clearHistory = () => {
    setHistory([])
  }

  return (
    <ExportHistoryContext.Provider value={{ history, addExport, updateExport, clearHistory }}>
      {children}
    </ExportHistoryContext.Provider>
  )
}

export const useExportHistory = () => {
  const context = useContext(ExportHistoryContext)
  if (context === undefined) {
    throw new Error('useExportHistory must be used within an ExportHistoryProvider')
  }
  return context
}