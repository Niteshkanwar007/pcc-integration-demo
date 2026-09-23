'use client';

import React from 'react';
import {
  X,
  Package,
  Calendar,
  User,
  Building2,
  CheckCircle2,
  Truck,
  Clock,
  FileText,
  AlertCircle,
  Activity,
} from 'lucide-react';
import { DMEOrder, DMEOrderStatus } from '@/dme/types';

interface OrderDetailModalProps {
  order: DMEOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, status: DMEOrderStatus) => void;
}

export function OrderDetailModal({ order, onClose, onUpdateStatus }: OrderDetailModalProps) {
  if (!order) return null;

  const getStatusBadge = (status: DMEOrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            Dispatched
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Submitted
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-slate-900 text-white flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  DME Order Specification
                </h2>
                <span className="font-mono text-xs text-slate-700 font-semibold bg-slate-200 px-1.5 py-0.5 rounded">
                  {order.orderId}
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Created on {new Date(order.orderDate).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Status banner */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
            <div>
              <span className="text-slate-700 block text-[11px] mb-0.5">Order Status</span>
              {getStatusBadge(order.status)}
            </div>
            <div className="text-right">
              <span className="text-slate-700 block text-[11px] mb-0.5">Priority</span>
              <span
                className={`font-semibold px-2 py-0.5 rounded text-[11px] font-mono ${
                  order.priority === 'STAT'
                    ? 'bg-red-100 text-red-800'
                    : order.priority === 'URGENT'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {order.priority}
              </span>
            </div>
          </div>

          {/* Equipment details */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-white space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Equipment Details
            </span>
            <div className="font-semibold text-sm text-slate-900">{order.equipmentType}</div>
            <div className="flex items-center gap-2 text-slate-700">
              <span className="bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-200">
                Category: {order.category}
              </span>
            </div>
          </div>

          {/* Resident & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Patient / Resident
              </span>
              <div className="font-medium text-slate-900">{order.residentName}</div>
              <div className="font-mono text-slate-700 text-[11px] mt-0.5">MRN: {order.mrn}</div>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Facility & Room
              </span>
              <div className="font-medium text-slate-900 truncate" title={order.facilityName}>
                {order.facilityName}
              </div>
              <div className="font-mono text-slate-700 text-[11px] mt-0.5">Room {order.room}</div>
            </div>
          </div>

          {/* Clinical Indication & Prescriber */}
          <div className="border border-slate-200 rounded-lg p-3 bg-white space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
              Clinical Indication (PointClickCare Diagnostic Link)
            </span>
            <div className="flex items-start gap-2">
              <span className="bg-amber-50 text-amber-900 border border-amber-200 font-mono text-xs px-2 py-0.5 rounded font-semibold shrink-0">
                {order.diagnosisIcd10}
              </span>
              <div>
                <div className="font-medium text-slate-900">{order.diagnosisDescription}</div>
                <div className="text-[11px] text-slate-700 mt-0.5">
                  Ordered by: {order.orderingUser} ({order.orderingUserRole})
                </div>
              </div>
            </div>
          </div>

          {/* Clinical notes */}
          {order.notes && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Clinical Notes / Instructions
              </span>
              <p className="text-slate-800 text-xs leading-relaxed">{order.notes}</p>
            </div>
          )}

          {/* Associated audit ID */}
          {order.associatedEventId && (
            <div className="flex items-center justify-between text-[11px] text-slate-700 border-t border-slate-200 pt-2 font-mono">
              <span>Audit Event ID:</span>
              <span>{order.associatedEventId}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
