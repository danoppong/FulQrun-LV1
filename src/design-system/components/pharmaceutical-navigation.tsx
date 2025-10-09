'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

// Navigation Types
interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string;
  pharmaceutical?: boolean;
  children?: NavigationItem[];
}

interface PharmaceuticalNavigationProps {
  items: NavigationItem[];
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  onLogout?: () => void;
  pharmaceutical?: boolean;
}

// Main Navigation Component
const PharmaceuticalNavigation: React.FC<PharmaceuticalNavigationProps> = ({
  items,
  user,
  onLogout,
  pharmaceutical = true
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  
  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => pathname === href;
  const isParentActive = (item: NavigationItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(child => isActive(child.href)) || false;
  };

  return (
    <>
      {/* Desktop Navigation */}
      <nav className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 lg:border-r lg:border-gray-200 lg:bg-white lg:pt-5 lg:pb-4 ${
        pharmaceutical ? 'pharmaceutical-nav' : ''
      }`}>
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-6">
          <div className={`text-xl font-bold ${
            pharmaceutical ? 'text-medical-blue-600' : 'text-gray-900'
          }`}>
            FulQrun
          </div>
        </div>

        {/* Navigation Items */}
        <div className="mt-6 flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-3 space-y-1">
            {items.map((item) => (
              <NavigationItemDesktop 
                key={item.name} 
                item={item} 
                isActive={isActive}
                isParentActive={isParentActive}
                expandedItems={expandedItems}
                toggleExpanded={toggleExpanded}
                pharmaceutical={pharmaceutical}
              />
            ))}
          </nav>
        </div>

        {/* User Profile */}
        {user && (
          <UserProfile user={user} onLogout={onLogout} pharmaceutical={pharmaceutical} />
        )}
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className={`text-xl font-bold ${
            pharmaceutical ? 'text-medical-blue-600' : 'text-gray-900'
          }`}>
            FulQrun
          </div>
          
          <button
            onClick={toggleMobileMenu}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <span className="sr-only">Open main menu</span>
            <div className="w-6 h-6 flex flex-col justify-center space-y-1">
              <motion.div 
                className="w-full h-0.5 bg-current"
                animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 4 : 0 }}
              />
              <motion.div 
                className="w-full h-0.5 bg-current"
                animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
              />
              <motion.div 
                className="w-full h-0.5 bg-current"
                animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -4 : 0 }}
              />
            </div>
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 lg:hidden"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-25"
                onClick={toggleMobileMenu}
              />

              {/* Menu Panel */}
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="relative flex flex-col w-full max-w-xs bg-white shadow-xl"
              >
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  <nav className="px-3 space-y-1">
                    {items.map((item) => (
                      <NavigationItemMobile
                        key={item.name}
                        item={item}
                        isActive={isActive}
                        isParentActive={isParentActive}
                        expandedItems={expandedItems}
                        toggleExpanded={toggleExpanded}
                        pharmaceutical={pharmaceutical}
                        onItemClick={() => setIsMobileMenuOpen(false)}
                      />
                    ))}
                  </nav>
                </div>

                {/* Mobile User Profile */}
                {user && (
                  <div className="flex-shrink-0 border-t border-gray-200 p-4">
                    <UserProfile user={user} onLogout={onLogout} pharmaceutical={pharmaceutical} mobile />
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

// Desktop Navigation Item
const NavigationItemDesktop: React.FC<{
  item: NavigationItem;
  isActive: (href: string) => boolean;
  isParentActive: (item: NavigationItem) => boolean;
  expandedItems: string[];
  toggleExpanded: (name: string) => void;
  pharmaceutical: boolean;
}> = ({ item, isActive, isParentActive, expandedItems, toggleExpanded, pharmaceutical }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.name);
  const itemIsActive = isActive(item.href);
  const parentActive = isParentActive(item);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleExpanded(item.name)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
            parentActive
              ? pharmaceutical
                ? 'bg-medical-blue-100 text-medical-blue-700'
                : 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            {item.icon && <span className="mr-3">{item.icon}</span>}
            <span>{item.name}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-1 space-y-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    className={`block px-3 py-2 text-sm rounded-lg transition-colors duration-150 ${
                      isActive(child.href)
                        ? pharmaceutical
                          ? 'bg-medical-blue-50 text-medical-blue-600 border-l-2 border-medical-blue-600'
                          : 'bg-blue-50 text-blue-600 border-l-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {child.name}
                    {child.badge && (
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        pharmaceutical ? 'bg-medical-blue-100 text-medical-blue-600' : 'bg-blue-100 text-blue-600'
                      }`}>
                        {child.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-150 ${
        itemIsActive
          ? pharmaceutical
            ? 'bg-medical-blue-100 text-medical-blue-700'
            : 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {item.icon && <span className="mr-3">{item.icon}</span>}
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          pharmaceutical ? 'bg-medical-blue-100 text-medical-blue-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
};

// Mobile Navigation Item (similar structure but with mobile-specific styling)
const NavigationItemMobile: React.FC<{
  item: NavigationItem;
  isActive: (href: string) => boolean;
  isParentActive: (item: NavigationItem) => boolean;
  expandedItems: string[];
  toggleExpanded: (name: string) => void;
  pharmaceutical: boolean;
  onItemClick: () => void;
}> = ({ item, isActive, isParentActive, expandedItems, toggleExpanded, pharmaceutical, onItemClick }) => {
  const hasChildren = item.children && item.children.length > 0;
  const isExpanded = expandedItems.includes(item.name);
  const itemIsActive = isActive(item.href);
  const parentActive = isParentActive(item);

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => toggleExpanded(item.name)}
          className={`w-full flex items-center justify-between px-3 py-2 text-base font-medium rounded-lg transition-colors duration-150 ${
            parentActive
              ? pharmaceutical
                ? 'bg-medical-blue-100 text-medical-blue-700'
                : 'bg-blue-100 text-blue-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center">
            {item.icon && <span className="mr-3">{item.icon}</span>}
            <span>{item.name}</span>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            →
          </motion.div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-6 mt-1 space-y-1">
                {item.children?.map((child) => (
                  <Link
                    key={child.name}
                    href={child.href}
                    onClick={onItemClick}
                    className={`block px-3 py-2 text-base rounded-lg transition-colors duration-150 ${
                      isActive(child.href)
                        ? pharmaceutical
                          ? 'bg-medical-blue-50 text-medical-blue-600'
                          : 'bg-blue-50 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {child.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onItemClick}
      className={`flex items-center px-3 py-2 text-base font-medium rounded-lg transition-colors duration-150 ${
        itemIsActive
          ? pharmaceutical
            ? 'bg-medical-blue-100 text-medical-blue-700'
            : 'bg-blue-100 text-blue-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {item.icon && <span className="mr-3">{item.icon}</span>}
      <span className="flex-1">{item.name}</span>
      {item.badge && (
        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
          pharmaceutical ? 'bg-medical-blue-100 text-medical-blue-600' : 'bg-blue-100 text-blue-600'
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
};

// User Profile Component
const UserProfile: React.FC<{
  user: { name: string; email: string; avatar?: string; role: string };
  onLogout?: () => void;
  pharmaceutical: boolean;
  mobile?: boolean;
}> = ({ user, onLogout, pharmaceutical, mobile = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative ${mobile ? '' : 'border-t border-gray-200 pt-4 px-3'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150"
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium ${
          pharmaceutical ? 'bg-medical-blue-600' : 'bg-blue-600'
        }`}>
          {user.avatar ? (
            <Image src={user.avatar} alt={user.name} width={32} height={32} className="w-8 h-8 rounded-full" />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
          >
            <button
              onClick={() => {
                onLogout?.();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
            >
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export { PharmaceuticalNavigation };
export type { NavigationItem, PharmaceuticalNavigationProps };