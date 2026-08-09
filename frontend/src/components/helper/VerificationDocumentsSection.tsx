import { useRef, useState } from 'react';
import { useMyHelperProfile } from '../../hooks/useProfile';
import { useUploadVerificationDocument } from '../../hooks/useUpload';
import { uploadToCloudinary } from '../../lib/cloudinary';
import {
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus,
} from '../../types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Select } from '../ui/Select';

const DOC_TYPES = ['ID_PROOF', 'ADDRESS_PROOF', 'CERTIFICATE', 'OTHER'] as const;

function statusClasses(status: VerificationStatus) {
  if (status === 'VERIFIED') return 'bg-primary-100 text-primary-700';
  if (status === 'REJECTED') return 'bg-danger/10 text-danger';
  return 'bg-amber-100 text-amber-800';
}

export function VerificationDocumentsSection() {
  const helperQuery = useMyHelperProfile();
  const { mutate, isPending, error } = useUploadVerificationDocument();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>(DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [success, setSuccess] = useState(false);

  if (helperQuery.isLoading) return null;
  if (helperQuery.isError || !helperQuery.data) return null;

  const documents = helperQuery.data.documents;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploadError('');
    setSuccess(false);
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      mutate(
        { docType, url },
        {
          onSuccess: () => setSuccess(true),
          onError: (err) => setUploadError(err.message),
        },
      );
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-800">
          Verification documents
        </h2>
        <Badge className={statusClasses(helperQuery.data.verificationStatus)}>
          {VERIFICATION_STATUS_LABELS[helperQuery.data.verificationStatus]}
        </Badge>
      </div>
      <p className="mt-1 text-sm text-neutral-600">
        Upload proof of identity and address so our team can verify your profile.
      </p>

      {documents.length > 0 && (
        <ul className="mt-4 divide-y divide-neutral-100">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {doc.docType}
                </p>
                <p className="text-xs text-neutral-600">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Badge className={statusClasses(doc.status)}>
                {VERIFICATION_STATUS_LABELS[doc.status]}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <Select
          label="Document type"
          value={docType}
          onChange={(event) => setDocType(event.target.value)}
          className="flex-1"
        >
          {DOC_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        <Button
          type="button"
          variant="secondary"
          disabled={uploading}
          isLoading={isPending}
          onClick={() => fileRef.current?.click()}
        >
          {uploading ? 'Uploading…' : 'Choose a file'}
        </Button>
      </div>

      {uploadError && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {uploadError}
        </p>
      )}
      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error.message}
        </p>
      )}
      {success && (
        <p className="mt-2 rounded-xl bg-primary-100 px-3 py-2 text-sm text-primary-700">
          Document uploaded — our team will review it shortly.
        </p>
      )}
    </Card>
  );
}