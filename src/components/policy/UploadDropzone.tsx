"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

export interface PolicyFileInfo {
  name: string;
  size: number | string;
  isSample?: boolean;
}

interface UploadDropzoneProps {
  selectedFile: PolicyFileInfo | null;
  onSelectFile: (file: PolicyFileInfo) => void;
  onClearFile: () => void;
  samplePolicyPath?: string;
  isIngesting?: boolean;
}

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

function formatFileSize(size: number | string): string {
  if (typeof size === "string") return size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadDropzone({
  selectedFile,
  onSelectFile,
  onClearFile,
  samplePolicyPath,
  isIngesting = false,
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = (file: File) => {
    setErrorMessage(null);

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setErrorMessage("Only PDF documents are supported.");
      return;
    }

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage("File exceeds the maximum limit of 10 MB.");
      return;
    }

    onSelectFile({
      name: file.name,
      size: file.size,
      isSample: false,
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isIngesting) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (isIngesting) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSelect(e.target.files[0]);
    }
    // reset input so the same file can be re-selected if removed
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleUseSample = () => {
    setErrorMessage(null);
    const filename = samplePolicyPath
      ? samplePolicyPath.split("/").pop() || "sample-refund-policy.pdf"
      : "sample-refund-policy.pdf";

    onSelectFile({
      name: filename,
      size: "2.4 MB (sample fixture)",
      isSample: true,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Error state */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 8,
            background: "var(--danger-soft)",
            color: "var(--danger)",
            fontSize: 14,
            border: "1px solid var(--border)",
          }}
        >
          <AlertCircle size={16} strokeWidth={1.5} />
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              marginLeft: "auto",
              background: "transparent",
              border: "none",
              color: "inherit",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Dropzone container */}
      {!selectedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          tabIndex={0}
          role="button"
          aria-label="Upload PDF policy document. Drag and drop file or press to browse."
          style={{
            border: "1px dashed var(--border-strong)",
            borderRadius: 12,
            padding: "36px 24px",
            textAlign: "center",
            background: isDragOver ? "var(--accent-soft)" : "var(--surface)",
            cursor: "pointer",
            transition: "background 150ms ease-out, border-color 150ms ease-out",
            outline: "none",
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--surface-2)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
            }}
          >
            <UploadCloud size={24} strokeWidth={1.5} />
          </div>

          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}
          >
            Drag and drop policy PDF here, or browse
          </h3>

          <p
            style={{
              fontSize: 13,
              color: "var(--text-muted)",
              marginBottom: 16,
            }}
          >
            Accepts PDF documents up to 10 MB
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid var(--border-strong)",
                background: "var(--surface)",
                color: "var(--text)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Browse file
            </button>

            <span style={{ fontSize: 13, color: "var(--text-faint)" }}>or</span>

            <button
              type="button"
              onClick={handleUseSample}
              style={{
                height: 36,
                padding: "0 14px",
                borderRadius: 8,
                border: "1px solid var(--border-strong)",
                background: "var(--surface-2)",
                color: "var(--accent)",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              Use sample policy
            </button>
          </div>
        </div>
      ) : (
        /* Selected file card */
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 16,
            background: "var(--surface)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: "var(--accent-soft)",
                color: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FileText size={20} strokeWidth={1.5} />
            </div>

            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                  wordBreak: "break-all",
                }}
              >
                {selectedFile.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                {formatFileSize(selectedFile.size)}
                {selectedFile.isSample ? " · Bundled fixture" : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 500,
                padding: "3px 8px",
                borderRadius: 999,
                background: "var(--success-soft)",
                color: "var(--success)",
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2} />
              Uploaded
            </span>

            {!isIngesting && (
              <button
                type="button"
                onClick={onClearFile}
                aria-label="Remove selected file"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  border: "none",
                  background: "transparent",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
