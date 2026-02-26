import { useState } from 'react';
import { useWelfare } from '@/context/WelfareContext';
import { useAuth } from '@/context/AuthContext';
import { getWelfareTypeLabel } from '@/lib/utils';
import { AlertTriangle, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RevisionUploadModal } from '@/components/forms/RevisionUploadModal';
import { WelfareRequest } from '@/types';

export function RevisionRequestBanner() {
  const { user } = useAuth();
  const { welfareRequests } = useWelfare();
  const [selectedRequest, setSelectedRequest] = useState<WelfareRequest | null>(null);

  // Filter requests that need revision for current user
  const revisionRequests = welfareRequests.filter(
    r => r.userId === user?.id && r.status === 'pending_revision'
  );

  if (revisionRequests.length === 0) return null;

  const getAttachments = (req: WelfareRequest): string[] => {
    return Array.isArray(req.attachments) ? req.attachments : [];
  };

  return (
    <>
      <div className="mb-6 bg-amber-50 border border-amber-300 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <h3 className="font-semibold text-amber-800">
            คุณมี {revisionRequests.length} คำร้องที่ต้องแนบเอกสารเพิ่มเติม
          </h3>
        </div>
        <div className="space-y-2">
          {revisionRequests.map(req => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-3 bg-white rounded-md px-3 py-2.5 border border-amber-200"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 truncate">
                  คำร้อง #{req.id} — {getWelfareTypeLabel(req.type)}
                  {req.amount ? ` (${Number(req.amount).toLocaleString('th-TH')} บาท)` : ''}
                </p>
                {req.revisionNote && (
                  <p className="text-xs text-amber-700 mt-0.5 truncate">
                    หมายเหตุ: "{req.revisionNote}"
                  </p>
                )}
              </div>
              <Button
                size="sm"
                className="bg-amber-600 hover:bg-amber-700 flex-shrink-0"
                onClick={() => setSelectedRequest(req)}
              >
                <Upload className="h-4 w-4 mr-1.5" />
                แนบเอกสาร
              </Button>
            </div>
          ))}
        </div>
      </div>

      {selectedRequest && (
        <RevisionUploadModal
          isOpen={!!selectedRequest}
          onClose={() => setSelectedRequest(null)}
          requestId={selectedRequest.id}
          currentAttachments={getAttachments(selectedRequest)}
          revisionNote={selectedRequest.revisionNote}
          revisionRequestedBy={selectedRequest.revisionRequestedBy}
          onSuccess={() => setSelectedRequest(null)}
        />
      )}
    </>
  );
}
