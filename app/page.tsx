'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Activity,
  Users,
  Package,
  Layers,
  Radio,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  PlusCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { MetricsBar } from '@/components/MetricsBar';
import { WorkflowPipeline } from '@/components/WorkflowPipeline';
import { ResidentList } from '@/components/ResidentList';
import { ResidentDetailModal } from '@/components/ResidentDetailModal';
import { ADTSimulatorModal } from '@/components/ADTSimulatorModal';
import { CreateOrderModal } from '@/components/CreateOrderModal';
import { OrderDetailModal } from '@/components/OrderDetailModal';
import { EventLogTable } from '@/components/EventLogTable';
import { OrderListTable } from '@/components/OrderListTable';
import { ArchitectureModal } from '@/components/ArchitectureModal';
import { RecommendationsPreview } from '@/components/RecommendationsPreview';
import { CapabilityMatrixTable } from '@/components/CapabilityMatrixTable';
import { RequestInspectorTable } from '@/components/RequestInspectorTable';
import { CanonicalResident, IntegrationEvent, IntegrationMetrics, InspectorTraceRecord } from '@/integration/types';
import { DMEOrder, SyntheticEquipmentRecommendation } from '@/dme/types';

export default function IntegrationDashboardPage() {
  const [metrics, setMetrics] = useState<IntegrationMetrics | null>(null);
  const [residents, setResidents] = useState<(CanonicalResident & { recommendationsCount?: number; ordersCount?: number })[]>([]);
  const [orders, setOrders] = useState<DMEOrder[]>([]);
  const [events, setEvents] = useState<IntegrationEvent[]>([]);
  const [traces, setTraces] = useState<InspectorTraceRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'residents' | 'orders' | 'events' | 'inspector' | 'matrix' | 'rules'>('overview');

  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [isADTOpen, setIsADTOpen] = useState(false);
  const [isOrderOpen, setIsOrderOpen] = useState(false);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<CanonicalResident | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<DMEOrder | null>(null);
  const [orderResident, setOrderResident] = useState<CanonicalResident | null>(null);
  const [orderRecommendation, setOrderRecommendation] = useState<SyntheticEquipmentRecommendation | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [dashRes, resRes, ordersRes] = await Promise.all([
        fetch('/api/integration/dashboard'),
        fetch('/api/residents'),
        fetch('/api/dme/orders'),
      ]);

      const [dashData, resData, ordersData] = await Promise.all([
        dashRes.json(),
        resRes.json(),
        ordersRes.json(),
      ]);

      if (dashData.success) {
        setMetrics(dashData.metrics);
        setEvents(dashData.recentEvents || []);
        setTraces(dashData.recentTraces || []);
      }
      if (resData.success) {
        setResidents(resData.residents || []);
      }
      if (ordersData.success) {
        setOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [dashRes, resRes, ordersRes] = await Promise.all([
          fetch('/api/integration/dashboard'),
          fetch('/api/residents'),
          fetch('/api/dme/orders'),
        ]);

        const [dashData, resData, ordersData] = await Promise.all([
          dashRes.json(),
          resRes.json(),
          ordersRes.json(),
        ]);

        if (!ignore) {
          if (dashData.success) {
            setMetrics(dashData.metrics);
            setEvents(dashData.recentEvents || []);
            setTraces(dashData.recentTraces || []);
          }
          if (resData.success) {
            setResidents(resData.residents || []);
          }
          if (ordersData.success) {
            setOrders(ordersData.orders || []);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, []);

  // Sync Action
  const handleSyncResidents = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to sync residents:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Reset to Baseline Action
  const handleResetData = async () => {
    if (!confirm('Reset all synthetic data and events to baseline seed state?')) return;
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchDashboardData();
      }
    } catch (err) {
      console.error('Failed to reset state:', err);
    }
  };

  // Handle Order trigger from resident card or recommendation
  const handleOpenOrderWithResident = (
    resident: CanonicalResident,
    rec?: SyntheticEquipmentRecommendation
  ) => {
    setOrderResident(resident);
    setOrderRecommendation(rec || null);
    setSelectedResident(null); // Close detail modal if open
    setIsOrderOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        metrics={metrics}
        isSyncing={isSyncing}
        onSync={handleSyncResidents}
        onOpenADTSimulator={() => setIsADTOpen(true)}
        onOpenNewOrder={() => {
          setOrderResident(null);
          setOrderRecommendation(null);
          setIsOrderOpen(true);
        }}
        onReset={handleResetData}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Content Area - Full-width desktop layout (98vw max 1880px) */}
      <main className="flex-1 w-full max-w-[98vw] 2xl:max-w-[1880px] mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
        {/* KPI Metrics Summary Bar */}
        <MetricsBar metrics={metrics} />

        {/* Primary Integration Workflow Pipeline */}
        <WorkflowPipeline
          metrics={metrics}
          onSync={handleSyncResidents}
          onOpenADT={() => setIsADTOpen(true)}
          onOpenOrder={() => {
            setOrderResident(null);
            setOrderRecommendation(null);
            setIsOrderOpen(true);
          }}
          onViewRules={() => setActiveTab('rules')}
          isSyncing={isSyncing}
        />

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white rounded-t-lg px-3 pt-2 shadow-2xs flex items-center justify-between overflow-x-auto">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Console Overview
            </button>

            <button
              onClick={() => setActiveTab('residents')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'residents'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Synchronized Residents ({residents.length})
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'orders'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              DME Orders ({orders.length})
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'events'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Audit Event Log ({events.length})
            </button>

            <button
              onClick={() => setActiveTab('inspector')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'inspector'
                  ? 'border-emerald-600 text-emerald-800 bg-emerald-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              Request Inspector ({traces.length})
            </button>

            <button
              onClick={() => setActiveTab('matrix')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'matrix'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Capability Matrix
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`py-2 px-3 text-xs font-medium rounded-t-md transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 ${
                activeTab === 'rules'
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Recommendation Rules
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 pb-1.5 pr-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              Provider Mode: Synthetic PCC Client
            </span>
          </div>
        </div>

        {/* Tab Content Panels */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Split View: Recent Audit Events & Recent DME Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Left Column: Recent Audit Events */}
              <div>
                <EventLogTable events={events} limit={6} showFilters={false} />
                <div className="mt-1.5 text-right">
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    View all {events.length} audit events <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Right Column: Recent DME Orders */}
              <div>
                <OrderListTable
                  orders={orders}
                  limit={6}
                  onNewOrder={() => {
                    setOrderResident(null);
                    setOrderRecommendation(null);
                    setIsOrderOpen(true);
                  }}
                  onSelectOrder={(o) => setSelectedOrder(o)}
                />
                <div className="mt-1.5 text-right">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                  >
                    View all {orders.length} DME orders <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Section: Patient Roster Preview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-900">
                  Active Synchronized Patient Roster (Overview)
                </h3>
                <button
                  onClick={() => setActiveTab('residents')}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  Full Roster Controls <ArrowRight className="w-3 h-3" />
                </button>
              </div>
              <ResidentList
                residents={residents}
                onSelectResident={(r) => setSelectedResident(r)}
                onCreateOrderForResident={(r) => handleOpenOrderWithResident(r)}
              />
            </div>
          </div>
        )}

        {activeTab === 'residents' && (
          <ResidentList
            residents={residents}
            onSelectResident={(r) => setSelectedResident(r)}
            onCreateOrderForResident={(r) => handleOpenOrderWithResident(r)}
          />
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            <OrderListTable
              orders={orders}
              onNewOrder={() => {
                setOrderResident(null);
                setOrderRecommendation(null);
                setIsOrderOpen(true);
              }}
              onSelectOrder={(o) => setSelectedOrder(o)}
            />
          </div>
        )}

        {activeTab === 'events' && (
          <EventLogTable events={events} showFilters={true} />
        )}

        {activeTab === 'inspector' && (
          <RequestInspectorTable traces={traces} onRefresh={fetchDashboardData} />
        )}

        {activeTab === 'matrix' && (
          <CapabilityMatrixTable />
        )}

        {activeTab === 'rules' && (
          <RecommendationsPreview />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-3.5 px-4 sm:px-6 lg:px-8 text-xs text-slate-700 mt-8">
        <div className="w-full max-w-[98vw] 2xl:max-w-[1880px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">PCC Integration Demo</span>
            <span>&bull;</span>
            <span>Sanitized Technical Demonstration (Synthetic Mode)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsArchitectureOpen(true)}
              className="text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Modular Architecture Documentation
            </button>
            <span>&bull;</span>
            <span className="font-mono text-[11px] text-slate-700">
              Target Framework: Next.js + TypeScript
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ResidentDetailModal
        resident={selectedResident}
        onClose={() => setSelectedResident(null)}
        onOrderEquipment={(res, rec) => handleOpenOrderWithResident(res, rec)}
      />

      <OrderDetailModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />

      <ADTSimulatorModal
        isOpen={isADTOpen}
        onClose={() => setIsADTOpen(false)}
        residents={residents}
        onEventProcessed={fetchDashboardData}
      />

      <CreateOrderModal
        isOpen={isOrderOpen}
        onClose={() => {
          setIsOrderOpen(false);
          setOrderResident(null);
          setOrderRecommendation(null);
        }}
        residents={residents}
        initialResident={orderResident}
        initialRecommendation={orderRecommendation}
        onOrderCreated={fetchDashboardData}
      />

      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
