'use client';

import React, { useState } from 'react';
import {
  X,
  Radio,
  Play,
  ArrowRight,
  UserPlus,
  ArrowLeftRight,
  LogOut,
  CheckCircle2,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { CanonicalResident } from '@/integration/types';
import { PREDEFINED_SCENARIOS } from '@/demo/event-simulator';

interface ADTSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  residents: CanonicalResident[];
  onEventProcessed: () => void;
}

export function ADTSimulatorModal({
  isOpen,
  onClose,
  residents,
  onEventProcessed,
}: ADTSimulatorModalProps) {
  const [mode, setMode] = useState<'preset' | 'custom'>('preset');
  const [selectedScenarioId, setSelectedScenarioId] = useState(PREDEFINED_SCENARIOS[0].id);

  // Custom Form State
  const [eventType, setEventType] = useState<'ADMISSION' | 'TRANSFER' | 'DISCHARGE'>('TRANSFER');
  const [selectedMrn, setSelectedMrn] = useState(residents[0]?.mrn || 'MRN-804192');
  const [customRoom, setCustomRoom] = useState('205');
  const [customBed, setCustomBed] = useState('B');
  const [dischargeReason, setDischargeReason] = useState('Course of Skilled Care Completed - Discharged to Home');
  const [newResidentName, setNewResidentName] = useState('James Holloway');
  const [newResidentFacility, setNewResidentFacility] = useState('FAC-101');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const currentResident = residents.find((r) => r.mrn === selectedMrn);

  const handleRunPreset = async () => {
    setIsSubmitting(true);
    setResultMessage(null);
    try {
      const res = await fetch('/api/adt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId: selectedScenarioId }),
      });
      const data = await res.json();
      if (data.success) {
        setResultMessage({
          type: 'success',
          text: `Success: ${data.result.message} (Processed in ${data.result.event.processingTimeMs}ms)`,
        });
        onEventProcessed();
      } else {
        setResultMessage({ type: 'error', text: `Error: ${data.error}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger event';
      setResultMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCustom = async () => {
    setIsSubmitting(true);
    setResultMessage(null);

    const now = new Date().toISOString();
    let payload: Record<string, unknown> = {};

    if (eventType === 'ADMISSION') {
      const generatedMrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
      payload = {
        eventType: 'ADMISSION',
        patientId: `PCC-RES-${Date.now().toString().slice(-5)}`,
        mrn: generatedMrn,
        facId: newResidentFacility,
        timestamp: now,
        targetRoom: customRoom,
        targetBed: customBed,
        notes: newResidentName,
        diagnoses: [
          {
            code: 'L89.152',
            description: 'Pressure ulcer of sacral region, stage 2',
            classification: 'Primary',
            onsetDate: now.slice(0, 10),
            rank: 1,
            isActive: true,
          },
        ],
      };
    } else if (eventType === 'TRANSFER') {
      if (!currentResident) {
        setResultMessage({ type: 'error', text: 'Please select an existing resident to transfer.' });
        setIsSubmitting(false);
        return;
      }
      payload = {
        eventType: 'TRANSFER',
        patientId: currentResident.pccPatientId,
        mrn: currentResident.mrn,
        facId: currentResident.facilityId,
        timestamp: now,
        targetRoom: customRoom,
        targetBed: customBed,
        notes: `Simulated room transfer from ${currentResident.room}-${currentResident.bed} to ${customRoom}-${customBed}`,
      };
    } else if (eventType === 'DISCHARGE') {
      if (!currentResident) {
        setResultMessage({ type: 'error', text: 'Please select an existing resident to discharge.' });
        setIsSubmitting(false);
        return;
      }
      payload = {
        eventType: 'DISCHARGE',
        patientId: currentResident.pccPatientId,
        mrn: currentResident.mrn,
        facId: currentResident.facilityId,
        timestamp: now,
        dischargeReason,
        notes: `Simulated discharge from ${currentResident.facilityName}`,
      };
    }

    try {
      const res = await fetch('/api/adt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setResultMessage({
          type: 'success',
          text: `Success: ${data.result.message} (Processed in ${data.result.event.processingTimeMs}ms)`,
        });
        onEventProcessed();
      } else {
        setResultMessage({ type: 'error', text: `Error: ${data.error}` });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to trigger event';
      setResultMessage({ type: 'error', text: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  PointClickCare ADT Event Simulator
                </h2>
                <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold border border-blue-200">
                  SYNTHETIC
                </span>
              </div>
              <p className="text-xs text-slate-700">
                Simulate synthetic inbound HL7/Webhook Admission, Transfer & Discharge messages
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

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 text-xs px-4">
          <button
            onClick={() => setMode('preset')}
            className={`py-2 px-3 font-medium border-b-2 cursor-pointer transition-colors ${
              mode === 'preset'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Predefined Scenarios
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`py-2 px-3 font-medium border-b-2 cursor-pointer transition-colors ${
              mode === 'custom'
                ? 'border-blue-600 text-blue-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Custom Event Builder
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs">
          {resultMessage && (
            <div
              className={`p-3 rounded border text-xs flex items-start gap-2 ${
                resultMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-red-50 text-red-800 border-red-200'
              }`}
            >
              {resultMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="font-mono">{resultMessage.text}</span>
            </div>
          )}

          {mode === 'preset' ? (
            <div className="space-y-3">
              <label className="block font-medium text-slate-700">
                Select Demonstration Scenario:
              </label>
              <div className="space-y-2">
                {PREDEFINED_SCENARIOS.map((scen) => (
                  <div
                    key={scen.id}
                    onClick={() => setSelectedScenarioId(scen.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedScenarioId === scen.id
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            scen.type === 'ADMISSION'
                              ? 'bg-emerald-100 text-emerald-800'
                              : scen.type === 'TRANSFER'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-200 text-slate-800'
                          }`}
                        >
                          {scen.type}
                        </span>
                        <span className="font-semibold text-slate-900">{scen.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-700 font-mono">
                        Target MRN: {scen.payload.mrn}
                      </span>
                    </div>
                    <p className="text-slate-700 text-[11px]">{scen.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Event Type Selector */}
              <div>
                <label className="block font-medium text-slate-700 mb-1">Event Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ADMISSION', 'TRANSFER', 'DISCHARGE'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setEventType(type)}
                      className={`py-2 px-3 rounded border text-center font-medium cursor-pointer transition-colors ${
                        eventType === type
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {eventType === 'ADMISSION' ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1">New Resident Full Name</label>
                      <input
                        type="text"
                        value={newResidentName}
                        onChange={(e) => setNewResidentName(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">Facility Destination</label>
                      <select
                        value={newResidentFacility}
                        onChange={(e) => setNewResidentFacility(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs bg-white"
                      >
                        <option value="FAC-101">Pinecrest Rehabilitation (FAC-101)</option>
                        <option value="FAC-102">Meadowview Pavilion (FAC-102)</option>
                        <option value="FAC-103">Harborview Transitional (FAC-103)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 mb-1">Assigned Room</label>
                      <input
                        type="text"
                        value={customRoom}
                        onChange={(e) => setCustomRoom(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 mb-1">Bed Designation</label>
                      <input
                        type="text"
                        value={customBed}
                        onChange={(e) => setCustomBed(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-slate-700 mb-1">Target Resident</label>
                    <select
                      value={selectedMrn}
                      onChange={(e) => setSelectedMrn(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded text-xs bg-white font-mono"
                    >
                      {residents.map((r) => (
                        <option key={r.mrn} value={r.mrn}>
                          {r.mrn} - {r.fullName} (Room {r.room}-{r.bed}, {r.status})
                        </option>
                      ))}
                    </select>
                  </div>

                  {eventType === 'TRANSFER' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 mb-1">New Target Room</label>
                        <input
                          type="text"
                          value={customRoom}
                          onChange={(e) => setCustomRoom(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-700 mb-1">New Target Bed</label>
                        <input
                          type="text"
                          value={customBed}
                          onChange={(e) => setCustomBed(e.target.value)}
                          className="w-full p-2 border border-slate-300 rounded text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {eventType === 'DISCHARGE' && (
                    <div>
                      <label className="block text-slate-700 mb-1">Discharge Disposition / Reason</label>
                      <input
                        type="text"
                        value={dischargeReason}
                        onChange={(e) => setDischargeReason(e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-xs"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Wire Protocol Note */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-700">
            <span className="font-semibold text-slate-700">Integration Protocol Flow: </span>
            PCC Inbound Dispatch &rarr; PCC Event Parser &rarr; Synthetic PCC EHR State Update &rarr; Canonical Resident Store &rarr; Integration Audit Log.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-700">
            Simulated environment only
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={mode === 'preset' ? handleRunPreset : handleRunCustom}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isSubmitting ? 'Processing Event...' : 'Trigger ADT Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
