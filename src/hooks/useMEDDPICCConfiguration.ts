'use client'

import { useState, useEffect, useCallback } from 'react'
import { MEDDPICCConfig } from '@/lib/meddpicc'
import MEDDPICCConfigurationService, { 
  MEDDPICCConfigurationRecord, 
  ConfigurationValidation 
} from '@/lib/services/meddpicc-configuration'

export interface UseMEDDPICCConfigurationResult {
  // Configuration state
  config: MEDDPICCConfig | null
  configRecord: MEDDPICCConfigurationRecord | null
  isLoading: boolean
  hasChanges: boolean
  
  // Validation
  validation: ConfigurationValidation | null
  
  // Actions
  updateConfig: (config: MEDDPICCConfig) => void
  saveConfiguration: (options?: SaveConfigurationOptions) => Promise<void>
  resetToDefault: () => Promise<void>
  validateConfiguration: (config?: MEDDPICCConfig) => ConfigurationValidation
  exportConfiguration: () => Promise<string>
  importConfiguration: (jsonData: string, options?: ImportOptions) => Promise<void>
  
  // Error handling
  error: string | null
  clearError: () => void
}

export interface SaveConfigurationOptions {
  name?: string
  description?: string
  algorithmSettings?: Record<string, unknown>
}

export interface ImportOptions {
  overwrite?: boolean
  name?: string
  description?: string
}

export function useMEDDPICCConfiguration(): UseMEDDPICCConfigurationResult {
  const [config, setConfig] = useState<MEDDPICCConfig | null>(null)
  const [configRecord, setConfigRecord] = useState<MEDDPICCConfigurationRecord | null>(null)
  const [originalConfig, setOriginalConfig] = useState<MEDDPICCConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [validation, setValidation] = useState<ConfigurationValidation | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Load initial configuration
  const loadConfiguration = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const [activeConfig, configRecord] = await Promise.all([
        MEDDPICCConfigurationService.getActiveConfiguration(),
        MEDDPICCConfigurationService.getConfigurationRecord()
      ])
      
      setConfig(activeConfig)
      setOriginalConfig(activeConfig)
      setConfigRecord(configRecord)
      
      if (activeConfig) {
        const validation = MEDDPICCConfigurationService.validateConfiguration(activeConfig)
        setValidation(validation)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration')
      console.error('Failed to load MEDDPICC configuration:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadConfiguration()
  }, [loadConfiguration])

  // Calculate if there are unsaved changes
  const hasChanges = config && originalConfig ? 
    JSON.stringify(config) !== JSON.stringify(originalConfig) : false

  // Update configuration in state
  const updateConfig = useCallback((newConfig: MEDDPICCConfig) => {
    setConfig(newConfig)
    const validation = MEDDPICCConfigurationService.validateConfiguration(newConfig)
    setValidation(validation)
    setError(null)
  }, [])

  // Save configuration
  const saveConfiguration = useCallback(async (options: SaveConfigurationOptions = {}) => {
    if (!config) {
      throw new Error('No configuration to save')
    }

    try {
      setIsLoading(true)
      setError(null)

      const savedRecord = await MEDDPICCConfigurationService.saveConfiguration(config, options)
      
      setConfigRecord(savedRecord)
      setOriginalConfig(config)
      
      // Optionally trigger a global configuration reload
      // This would notify other components that the configuration has changed
      window.dispatchEvent(new CustomEvent('meddpicc-config-updated', { 
        detail: { config, record: savedRecord } 
      }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [config])

  // Reset to default configuration
  const resetToDefault = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      await MEDDPICCConfigurationService.resetToDefault()
      await loadConfiguration() // Reload the default configuration
      
      window.dispatchEvent(new CustomEvent('meddpicc-config-reset'))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [loadConfiguration])

  // Validate configuration
  const validateConfiguration = useCallback((configToValidate?: MEDDPICCConfig) => {
    const targetConfig = configToValidate || config
    if (!targetConfig) {
      return { isValid: false, errors: ['No configuration to validate'], warnings: [] }
    }
    
    return MEDDPICCConfigurationService.validateConfiguration(targetConfig)
  }, [config])

  // Export configuration
  const exportConfiguration = useCallback(async () => {
    try {
      setError(null)
      return await MEDDPICCConfigurationService.exportConfiguration()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export configuration'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }, [])

  // Import configuration
  const importConfiguration = useCallback(async (jsonData: string, options: ImportOptions = {}) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const importedRecord = await MEDDPICCConfigurationService.importConfiguration(jsonData, options)
      
      setConfigRecord(importedRecord)
      setConfig(importedRecord.configuration_data)
      setOriginalConfig(importedRecord.configuration_data)
      
      const validation = MEDDPICCConfigurationService.validateConfiguration(importedRecord.configuration_data)
      setValidation(validation)
      
      window.dispatchEvent(new CustomEvent('meddpicc-config-imported', { 
        detail: { config: importedRecord.configuration_data, record: importedRecord } 
      }))
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import configuration')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Clear error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    config,
    configRecord,
    isLoading,
    hasChanges,
    validation,
    updateConfig,
    saveConfiguration,
    resetToDefault,
    validateConfiguration,
    exportConfiguration,
    importConfiguration,
    error,
    clearError
  }
}

// Hook for listening to configuration changes across the app
export function useMEDDPICCConfigurationListener() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const handleConfigUpdate = (event: CustomEvent) => {
      setLastUpdate(new Date())
      console.log('MEDDPICC configuration updated:', event.detail)
    }

    const handleConfigReset = () => {
      setLastUpdate(new Date())
      console.log('MEDDPICC configuration reset to default')
    }

    const handleConfigImport = (event: CustomEvent) => {
      setLastUpdate(new Date())
      console.log('MEDDPICC configuration imported:', event.detail)
    }

    window.addEventListener('meddpicc-config-updated', handleConfigUpdate as EventListener)
    window.addEventListener('meddpicc-config-reset', handleConfigReset)
    window.addEventListener('meddpicc-config-imported', handleConfigImport as EventListener)

    return () => {
      window.removeEventListener('meddpicc-config-updated', handleConfigUpdate as EventListener)
      window.removeEventListener('meddpicc-config-reset', handleConfigReset)
      window.removeEventListener('meddpicc-config-imported', handleConfigImport as EventListener)
    }
  }, [])

  return { lastUpdate }
}

export default useMEDDPICCConfiguration