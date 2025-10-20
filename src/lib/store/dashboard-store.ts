'use client';

import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Types for real-time dashboard data
interface DashboardKPI {
  id: string;
  name: string;
  value: number;
  target: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
}

interface TerritoryData {
  id: string;
  name: string;
  performance: number;
  target: number;
  kpis: DashboardKPI[];
  lastUpdated: Date;
}

interface MLInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionRequired: boolean;
  createdAt: Date;
}

interface DashboardState {
  // Current user context
  currentUser: {
    id: string;
    role: 'rep' | 'manager' | 'admin';
    territories: string[];
  } | null;

  // Dashboard data
  kpis: DashboardKPI[];
  territories: TerritoryData[];
  insights: MLInsight[];
  
  // Real-time status
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // Loading states
  loading: {
    kpis: boolean;
    territories: boolean;
    insights: boolean;
  };

  // Actions
  setCurrentUser: (user: DashboardState['currentUser']) => void;
  updateKPI: (kpi: DashboardKPI) => void;
  updateTerritory: (territory: TerritoryData) => void;
  addInsight: (insight: MLInsight) => void;
  setConnectionStatus: (connected: boolean) => void;
  setLoading: (key: keyof DashboardState['loading'], loading: boolean) => void;
  
  // Bulk updates for real-time data
  bulkUpdateKPIs: (kpis: DashboardKPI[]) => void;
  bulkUpdateTerritories: (territories: TerritoryData[]) => void;
}

// Dashboard Store with real-time capabilities
export const useDashboardStore = create<DashboardState>()(
  subscribeWithSelector((set, get) => ({
    currentUser: null,
    kpis: [],
    territories: [],
    insights: [],
    isConnected: false,
    lastUpdate: null,
    loading: {
      kpis: false,
      territories: false,
      insights: false,
    },

    setCurrentUser: (user) => set({ currentUser: user }),

    updateKPI: (kpi) => set((state) => ({
      kpis: state.kpis.map(k => k.id === kpi.id ? kpi : k),
      lastUpdate: new Date()
    })),

    updateTerritory: (territory) => set((state) => ({
      territories: state.territories.map(t => t.id === territory.id ? territory : t),
      lastUpdate: new Date()
    })),

    addInsight: (insight) => set((state) => ({
      insights: [insight, ...state.insights.slice(0, 49)], // Keep last 50 insights
      lastUpdate: new Date()
    })),

    setConnectionStatus: (connected) => set({ 
      isConnected: connected,
      lastUpdate: connected ? new Date() : get().lastUpdate
    }),

    setLoading: (key, loading) => set((state) => ({
      loading: { ...state.loading, [key]: loading }
    })),

    bulkUpdateKPIs: (kpis) => set({
      kpis,
      lastUpdate: new Date()
    }),

    bulkUpdateTerritories: (territories) => set({
      territories,
      lastUpdate: new Date()
    }),
  }))
);

// WebSocket Manager for Real-Time Updates
class DashboardWebSocketManager {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(userId: string) {
    if (typeof window === 'undefined') return;

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'}/dashboard/${userId}`;
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('Dashboard WebSocket connected');
        useDashboardStore.getState().setConnectionStatus(true);
        this.reconnectAttempts = 0;
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('Dashboard WebSocket disconnected');
        useDashboardStore.getState().setConnectionStatus(false);
        this.attemptReconnect(userId);
      };

      this.socket.onerror = (error) => {
        console.error('Dashboard WebSocket error:', error);
        useDashboardStore.getState().setConnectionStatus(false);
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }

  private handleMessage(data: {
    type: 'kpi_update' | 'territory_update' | 'insight' | 'bulk_update';
    payload: unknown;
  }) {
    const store = useDashboardStore.getState();

    switch (data.type) {
      case 'kpi_update':
        store.updateKPI(data.payload as DashboardKPI);
        break;
      
      case 'territory_update':
        store.updateTerritory(data.payload as TerritoryData);
        break;
      
      case 'insight':
        store.addInsight(data.payload as MLInsight);
        break;
      
      case 'bulk_update':
        const payload = data.payload as {
          kpis?: DashboardKPI[];
          territories?: TerritoryData[];
        };
        if (payload.kpis) store.bulkUpdateKPIs(payload.kpis);
        if (payload.territories) store.bulkUpdateTerritories(payload.territories);
        break;
    }
  }

  private attemptReconnect(userId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect(userId);
      }, delay);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(message: { type: string; payload: unknown }) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    }
  }
}

// Singleton WebSocket Manager
export const dashboardWS = new DashboardWebSocketManager();

// Real-time Dashboard Hook
export const useRealTimeDashboard = (userId: string) => {
  const store = useDashboardStore();

  React.useEffect(() => {
    if (userId) {
      dashboardWS.connect(userId);
    }

    return () => {
      dashboardWS.disconnect();
    };
  }, [userId]);

  // Subscribe to store changes for debugging
  React.useEffect(() => {
    const unsubscribe = useDashboardStore.subscribe(
      (state) => state.lastUpdate,
      (lastUpdate) => {
        if (lastUpdate) {
          console.log('Dashboard data updated at:', lastUpdate);
        }
      }
    );

    return unsubscribe;
  }, []);

  return {
    ...store,
    // Convenience methods
    getKPIById: (id: string) => store.kpis.find(kpi => kpi.id === id),
    getTerritoryById: (id: string) => store.territories.find(t => t.id === id),
    getRecentInsights: (count: number = 10) => store.insights.slice(0, count),
    
    // Real-time status
    isRealTimeActive: store.isConnected,
    timeSinceLastUpdate: store.lastUpdate 
      ? Date.now() - store.lastUpdate.getTime() 
      : null,
  };
};

// Pharmaceutical KPI Calculations
export const calculateKPITrend = (current: number, previous: number): {
  change: number;
  trend: 'up' | 'down' | 'stable';
  percentage: number;
} => {
  const change = current - previous;
  const percentage = previous > 0 ? (change / previous) * 100 : 0;
  
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(percentage) > 1) { // More than 1% change
    trend = change > 0 ? 'up' : 'down';
  }

  return { change, trend, percentage };
};

// Mock data generators for development
export const generateMockKPIs = (): DashboardKPI[] => [
  {
    id: 'trx',
    name: 'Total Prescriptions (TRx)',
    value: 1250,
    target: 1300,
    change: 5.2,
    trend: 'up',
    lastUpdated: new Date()
  },
  {
    id: 'nrx',
    name: 'New Prescriptions (NRx)',
    value: 180,
    target: 200,
    change: -2.1,
    trend: 'down',
    lastUpdated: new Date()
  },
  {
    id: 'market_share',
    name: 'Market Share',
    value: 23.5,
    target: 25.0,
    change: 1.2,
    trend: 'up',
    lastUpdated: new Date()
  }
];

export const generateMockInsights = (): MLInsight[] => [
  {
    id: '1',
    type: 'prediction',
    title: 'TRx Forecast Alert',
    description: 'Current trajectory suggests 15% increase in TRx by month end',
    confidence: 0.87,
    impact: 'high',
    actionRequired: false,
    createdAt: new Date()
  },
  {
    id: '2',
    type: 'anomaly',
    title: 'Unusual Prescription Drop',
    description: 'Dr. Smith (Territory A) showed 40% decrease in prescriptions this week',
    confidence: 0.95,
    impact: 'medium',
    actionRequired: true,
    createdAt: new Date()
  }
];

export type {
  DashboardKPI,
  TerritoryData,
  MLInsight,
  DashboardState
};