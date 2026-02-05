import { auditLogApi } from '@/services/auditLogApi';
import { CreateAuditLogData } from '@/types';

/**
 * Fire-and-forget audit logger.
 * Never throws, never blocks the caller.
 */
export const auditLog = (data: CreateAuditLogData): void => {
  auditLogApi.createLog(data).catch((err) => {
    console.error('Audit log write failed (non-blocking):', err);
  });
};

// ---- Pre-built helpers for common actions ----

export const auditWelfareAction = (
  action: string,
  requestId: number | string,
  details: string,
  metadata?: Record<string, any>
): void => {
  auditLog({
    action,
    category: 'welfare_request',
    severity: action.includes('reject') ? 'medium' : 'low',
    details,
    resource_type: 'welfare_request',
    resource_id: String(requestId),
    metadata,
  });
};

export const auditLeaveAction = (
  action: string,
  requestId: number | string,
  details: string,
  metadata?: Record<string, any>
): void => {
  auditLog({
    action,
    category: 'leave_request',
    severity: action.includes('reject') ? 'medium' : 'low',
    details,
    resource_type: 'leave_request',
    resource_id: String(requestId),
    metadata,
  });
};

export const auditAuthAction = (
  action: 'login' | 'logout' | 'login_failed',
  details: string,
  status: 'success' | 'failed' = 'success'
): void => {
  auditLog({
    action,
    category: 'authentication',
    severity: action === 'login_failed' ? 'high' : 'low',
    status,
    details,
  });
};
