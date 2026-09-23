'use client';

import React from 'react';
import {
  Package,
  PlusCircle,
  Clock,
  CheckCircle2,
  Truck,
  Eye,
} from 'lucide-react';
import { DMEOrder, DMEOrderStatus } from '@/dme/types';

interface OrderListTableProps {
  orders: DMEOrder[];
  onNewOrder: () => void;
  onSelectOrder?: (order: DMEOrder) => void;
  limit?: number;
}

export function OrderListTable({
  orders,
  onNewOrder,
  onSelectOrder,
  limit,
}: OrderListTableProps) {
  const displayOrders = limit ? orders.slice(0, limit) : orders;

  const getStatusBadge = (status: DMEOrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Delivered
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-2.5 h-2.5 text-blue-600" />
            Dispatched
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Approved
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-2.5 h-2.5 text-amber-600" />
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  const getPriorityBadge = (priority: DMEOrder['priority']) => {
    switch (priority) {
      case 'STAT':
        return (
          <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded">
            STAT
          </span>
        );
      case 'URGENT':
        return (
          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
            URGENT
          </span>
        );
      case 'ROUTINE':
        return (
          <span className="text-[10px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
            ROUTINE
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-2xs overflow-hidden flex flex-col h-full">
      {/* Top Bar */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-700" />
          <h2 className="text-xs font-semibold text-slate-900 tracking-tight">
            DME Medical Equipment Orders
          </h2>
          <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
            {orders.length}
          </span>
        </div>

        <button
          onClick={onNewOrder}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium transition-colors shadow-2xs cursor-pointer"
        >
          <PlusCircle className="w-3 h-3" />
          New Order
        </button>
      </div>

      {/* Orders Table - Streamlined for Desktop Width */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-medium text-[11px]">
              <th className="py-2 px-3 w-[120px]">Order ID</th>
              <th className="py-2 px-3">Resident / MRN</th>
              <th className="py-2 px-3">Equipment</th>
              <th className="py-2 px-3 w-[80px]">Priority</th>
              <th className="py-2 px-3 w-[100px]">Status</th>
              <th className="py-2 px-3 w-[60px] text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {displayOrders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-700 text-xs">
                  No medical equipment orders recorded yet.
                </td>
              </tr>
            ) : (
              displayOrders.map((o) => (
                <tr
                  key={o.orderId}
                  onClick={() => onSelectOrder && onSelectOrder(o)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  {/* Order ID */}
                  <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-slate-900 text-xs">
                    {o.orderId}
                  </td>

                  {/* Resident / MRN */}
                  <td className="py-2 px-3">
                    <div className="font-medium text-slate-900 truncate max-w-[150px] 2xl:max-w-[200px]" title={o.residentName}>
                      {o.residentName}
                    </div>
                    <div className="text-[10px] text-slate-700 font-mono flex items-center gap-1.5">
                      <span>{o.mrn}</span>
                      <span>&bull;</span>
                      <span className="truncate max-w-[90px]" title={o.facilityName}>
                        {o.facilityName.split(' ')[0]}
                      </span>
                    </div>
                  </td>

                  {/* Equipment */}
                  <td className="py-2 px-3">
                    <div className="font-medium text-slate-800 truncate max-w-[180px] 2xl:max-w-[240px]" title={o.equipmentType}>
                      {o.equipmentType}
                    </div>
                    <div className="text-[10px] text-slate-700">
                      <span className="bg-slate-100 px-1 py-0.2 rounded font-mono text-[9px] border border-slate-200">
                        {o.category}
                      </span>
                    </div>
                  </td>

                  {/* Priority */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getPriorityBadge(o.priority)}
                  </td>

                  {/* Status */}
                  <td className="py-2 px-3 whitespace-nowrap">
                    {getStatusBadge(o.status)}
                  </td>

                  {/* Action */}
                  <td className="py-2 px-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectOrder) onSelectOrder(o);
                      }}
                      className="p-1 rounded text-slate-700 group-hover:text-slate-900 hover:bg-slate-200 transition-colors"
                      title="View Order Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
