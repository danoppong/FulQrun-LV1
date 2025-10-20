'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Enhanced Input Component
const PharmaceuticalInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'password';
  placeholder?: string;
  required?: boolean;
  error?: string;
  icon?: React.ReactNode;
  pharmaceutical?: boolean;
  disabled?: boolean;
}> = ({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder, 
  required = false, 
  error, 
  icon, 
  pharmaceutical = true,
  disabled = false
}) => {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const baseClasses = "w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2";
  const pharmaceuticalClasses = pharmaceutical 
    ? "border-medical-blue-200 focus:ring-medical-blue-500 focus:border-medical-blue-500" 
    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error ? "border-regulatory-red-500 focus:ring-regulatory-red-500" : "";
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pharmaceutical-input-group"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-regulatory-red-500">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          ref={inputRef}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            ${baseClasses}
            ${pharmaceuticalClasses}
            ${errorClasses}
            ${disabledClasses}
            ${icon ? 'pl-10' : ''}
          `}
        />
        
        {focused && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            className="absolute bottom-0 left-0 right-0 h-0.5 bg-medical-blue-500 origin-left"
          />
        )}
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-regulatory-red-600 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Enhanced Select Component
const PharmaceuticalSelect: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
  required?: boolean;
  error?: string;
  pharmaceutical?: boolean;
  disabled?: boolean;
}> = ({ 
  label, 
  value, 
  onChange, 
  options, 
  placeholder = "Select an option", 
  required = false, 
  error, 
  pharmaceutical = true,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const baseClasses = "w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 cursor-pointer";
  const pharmaceuticalClasses = pharmaceutical 
    ? "border-medical-blue-200 focus:ring-medical-blue-500 focus:border-medical-blue-500" 
    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500";
  const errorClasses = error ? "border-regulatory-red-500 focus:ring-regulatory-red-500" : "";
  const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "bg-white";

  const selectedOption = options.find(option => option.value === value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="pharmaceutical-select-group relative"
    >
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-regulatory-red-500">*</span>}
      </label>
      
      <div className="relative">
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            ${baseClasses}
            ${pharmaceuticalClasses}
            ${errorClasses}
            ${disabledClasses}
            flex items-center justify-between
          `}
        >
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            ↓
          </motion.div>
        </div>
        
        <AnimatePresence>
          {isOpen && !disabled && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <motion.div
                  key={option.value}
                  whileHover={{ backgroundColor: pharmaceutical ? '#f0f9ff' : '#f3f4f6' }}
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  className={`
                    px-4 py-3 cursor-pointer transition-colors duration-150
                    ${option.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-900'}
                    ${value === option.value ? (pharmaceutical ? 'bg-medical-blue-50 text-medical-blue-700' : 'bg-blue-50 text-blue-700') : ''}
                  `}
                >
                  {option.label}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-sm text-regulatory-red-600 mt-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// MEDDPICC Form Component
const MEDDPICCForm: React.FC<{
  data: {
    metrics: string;
    economicBuyer: string;
    decisionCriteria: string;
    decisionProcess: string;
    paperProcess: string;
    identifyPain: string;
    champion: string;
    competition: string;
  };
  onChange: (field: string, value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
}> = ({ data, onChange, onSubmit, loading = false }) => {
  const fields = [
    { key: 'metrics', label: 'Metrics', placeholder: 'Quantifiable business metrics' },
    { key: 'economicBuyer', label: 'Economic Buyer', placeholder: 'Decision maker with budget authority' },
    { key: 'decisionCriteria', label: 'Decision Criteria', placeholder: 'How the decision will be made' },
    { key: 'decisionProcess', label: 'Decision Process', placeholder: 'Steps in the decision-making process' },
    { key: 'paperProcess', label: 'Paper Process', placeholder: 'Procurement and legal requirements' },
    { key: 'identifyPain', label: 'Identify Pain', placeholder: 'Business pain points to address' },
    { key: 'champion', label: 'Champion', placeholder: 'Internal advocate for your solution' },
    { key: 'competition', label: 'Competition', placeholder: 'Competitive landscape analysis' }
  ];

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="meddpicc-form space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">MEDDPICC Assessment</h3>
        <p className="text-sm text-gray-600 mt-1">Complete the qualification criteria</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field, index) => (
          <motion.div
            key={field.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PharmaceuticalInput
              label={field.label}
              value={data[field.key as keyof typeof data]}
              onChange={(value) => onChange(field.key, value)}
              placeholder={field.placeholder}
              pharmaceutical={true}
            />
          </motion.div>
        ))}
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full bg-medical-blue-600 hover:bg-medical-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Processing...
          </>
        ) : (
          'Save Assessment'
        )}
      </motion.button>
    </motion.form>
  );
};

// Territory Management Form
const TerritoryForm: React.FC<{
  data: {
    name: string;
    region: string;
    salesRep: string;
    target: string;
    products: string[];
  };
  onChange: (field: string, value: string | string[]) => void;
  onSubmit: () => void;
  loading?: boolean;
  productOptions: Array<{ value: string; label: string }>;
  salesRepOptions: Array<{ value: string; label: string }>;
}> = ({ data, onChange, onSubmit, loading = false, productOptions: _productOptions, salesRepOptions }) => {
  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="territory-form space-y-6 bg-white p-6 rounded-xl shadow-lg border border-gray-100"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Territory Management</h3>
        <p className="text-sm text-gray-600 mt-1">Configure territory settings</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PharmaceuticalInput
          label="Territory Name"
          value={data.name}
          onChange={(value) => onChange('name', value)}
          placeholder="Enter territory name"
          required
        />
        
        <PharmaceuticalInput
          label="Region"
          value={data.region}
          onChange={(value) => onChange('region', value)}
          placeholder="Enter region"
          required
        />
        
        <PharmaceuticalSelect
          label="Sales Representative"
          value={data.salesRep}
          onChange={(value) => onChange('salesRep', value)}
          options={salesRepOptions}
          placeholder="Select sales rep"
          required
        />
        
        <PharmaceuticalInput
          label="Annual Target"
          value={data.target}
          onChange={(value) => onChange('target', value)}
          placeholder="Enter annual target"
          type="number"
          required
        />
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        type="submit"
        disabled={loading}
        className="w-full bg-clinical-green-600 hover:bg-clinical-green-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Saving...
          </>
        ) : (
          'Save Territory'
        )}
      </motion.button>
    </motion.form>
  );
};

export {
  PharmaceuticalInput,
  PharmaceuticalSelect,
  MEDDPICCForm,
  TerritoryForm
};