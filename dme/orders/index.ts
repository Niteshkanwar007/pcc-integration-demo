/**
 * DME Order Processing Service
 *
 * Manages medical equipment orders initiated through the integration console,
 * validating active patient eligibility, diagnosis alignment, and audit logging.
 */

import { DMEOrder, DMEOrderStatus, DMEOrderPriority, DMEEquipmentCategory } from '../types';
import { store } from '@/lib/store';
import { IntegrationError } from '@/integration/error-handling';

export interface CreateOrderPayload {
  mrn: string;
  equipmentType: string;
  category?: DMEEquipmentCategory;
  orderingUser: string;
  orderingUserRole?: string;
  diagnosisIcd10?: string;
  priority?: DMEOrderPriority;
  notes?: string;
}

export class DMEOrderService {
  public static inferCategory(equipmentType: string): DMEEquipmentCategory {
    const lower = equipmentType.toLowerCase();
    if (lower.includes('bed') || lower.includes('mattress') || lower.includes('overlay')) {
      return 'Support Surfaces';
    }
    if (lower.includes('oxygen') || lower.includes('concentrator') || lower.includes('suction') || lower.includes('ventilator')) {
      return 'Respiratory';
    }
    if (lower.includes('lift') || lower.includes('hoyer') || lower.includes('transfer board')) {
      return 'Patient Handling';
    }
    if (lower.includes('commode') || lower.includes('shower') || lower.includes('grab bar')) {
      return 'Bathroom Safety';
    }
    return 'Mobility';
  }

  public async createOrder(payload: CreateOrderPayload): Promise<DMEOrder> {
    const startTime = Date.now();
    const resident = store.getResident(payload.mrn);

    if (!resident) {
      throw new IntegrationError(
        'RESIDENT_NOT_FOUND',
        `Cannot create DME order: Resident with MRN ${payload.mrn} is not found in the synchronized database.`
      );
    }

    if (resident.status === 'DISCHARGED') {
      throw new IntegrationError(
        'INVALID_ORDER_STATE',
        `Warning: Resident ${resident.fullName} (${resident.mrn}) is currently DISCHARGED. Verify admission status before placing new facility equipment orders.`
      );
    }

    // Resolve diagnosis details
    let diagIcd10 = payload.diagnosisIcd10;
    let diagDesc = 'Not Specified';

    if (!diagIcd10 && resident.activeDiagnoses.length > 0) {
      diagIcd10 = resident.activeDiagnoses[0].icd10;
      diagDesc = resident.activeDiagnoses[0].description;
    } else if (diagIcd10) {
      const found = resident.activeDiagnoses.find((d) => d.icd10.toUpperCase() === diagIcd10?.toUpperCase());
      diagDesc = found ? found.description : 'Clinician entered diagnosis';
    } else {
      diagIcd10 = 'R68.89';
      diagDesc = 'Other general symptoms and signs';
    }

    const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const category = payload.category || DMEOrderService.inferCategory(payload.equipmentType);

    const order: DMEOrder = {
      orderId,
      mrn: resident.mrn,
      residentName: resident.fullName,
      facilityName: resident.facilityName || 'Facility Unspecified',
      room: resident.room ? `${resident.room}${resident.bed ? `-${resident.bed}` : ''}` : 'Unassigned',
      equipmentType: payload.equipmentType,
      category,
      orderDate: new Date().toISOString(),
      orderingUser: payload.orderingUser.trim(),
      orderingUserRole: payload.orderingUserRole || 'Care Coordinator / RN',
      diagnosisIcd10: diagIcd10,
      diagnosisDescription: diagDesc,
      status: 'SUBMITTED',
      priority: payload.priority || 'ROUTINE',
      notes: payload.notes,
    };

    store.addOrder(order);

    const elapsed = Date.now() - startTime;
    const auditEvent = store.addEvent({
      eventType: 'DME_ORDER_CREATED',
      mrn: resident.mrn,
      patientName: resident.fullName,
      source: 'DME Workflow',
      status: 'SUCCESS',
      processingTimeMs: Math.max(elapsed, 22),
      message: `Created DME Order ${order.orderId} (${order.equipmentType}) for ${resident.fullName}. Priority: ${order.priority}.`,
      details: {
        orderId: order.orderId,
        equipment: order.equipmentType,
        facility: order.facilityName,
      },
    });

    order.associatedEventId = auditEvent.id;
    return order;
  }

  public async updateOrderStatus(orderId: string, newStatus: DMEOrderStatus): Promise<DMEOrder | null> {
    const orders = store.getAllOrders();
    const order = orders.find((o) => o.orderId === orderId);
    if (!order) return null;

    order.status = newStatus;
    store.addEvent({
      eventType: 'DME_ORDER_UPDATED',
      mrn: order.mrn,
      patientName: order.residentName,
      source: 'DME Workflow',
      status: 'SUCCESS',
      processingTimeMs: 15,
      message: `Updated Order ${orderId} status to ${newStatus}.`,
      details: { orderId, newStatus },
    });

    return order;
  }
}
