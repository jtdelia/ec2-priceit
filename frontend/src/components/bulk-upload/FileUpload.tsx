import { useCallback, useRef, useState } from "react"
import { UploadCloud, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { useTelemetry } from "@/hooks/useTelemetry"

const ACCEPTED_EXTENSIONS = ["csv", "xls", "xlsx"]
const ACCEPT_ATTRIBUTE = ".csv,.xls,.xlsx"

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  multiple?: boolean
  maxFileSizeMB?: number
  className?: string
  disabled?: boolean
  statusMessage?: string
}

interface ValidationResult {
  validFiles: File[]
  errors: string[]
}

function validateFiles(
  files: File[],
  multiple: boolean,
  maxFileSizeMB: number
): ValidationResult {
  const maxSizeBytes = maxFileSizeMB * 1024 * 1024
  const acceptedExtensions = new Set(ACCEPTED_EXTENSIONS)
  const validationErrors: string[] = []
  const acceptedFiles: File[] = []

  files.forEach((file) => {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? ""
    const isExtensionAccepted = acceptedExtensions.has(extension)

    if (!isExtensionAccepted) {
      validationErrors.push(
        `${file.name} has an unsupported file type. Accepted types: ${ACCEPTED_EXTENSIONS.join(", ")}.`
      )
      return
    }

    if (file.size > maxSizeBytes) {
      validationErrors.push(
        `${file.name} exceeds the maximum size of ${maxFileSizeMB} MB.`
      )
      return
    }

    acceptedFiles.push(file)
  })

  if (!multiple && acceptedFiles.length > 1) {
    validationErrors.push("Only a single file can be uploaded at a time.")
    return {
      validFiles: acceptedFiles.slice(0, 1),
      errors: validationErrors,
    }
  }

  return {
    validFiles: acceptedFiles,
    errors: validationErrors,
  }
}

export function FileUpload({
  onFilesSelected,
  multiple = true,
  maxFileSizeMB = 10,
  className,
  disabled = false,
  statusMessage,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessages, setErrorMessages] = useState<string[]>([])
  const [localFiles, setLocalFiles] = useState<File[]>([])
  const { trackBulkUpload, trackError } = useTelemetry()

  const processFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || disabled) {
        return
      }

      const incomingFiles = Array.from(fileList)
      const { validFiles, errors } = validateFiles(
        incomingFiles,
        multiple,
        maxFileSizeMB
      )

      setErrorMessages(errors)
      if (validFiles.length === 0) {
        // Track upload errors
        if (errors.length > 0) {
          trackError("file_upload_validation_failed", errors.join("; "), {
            component: "FileUpload",
            file_count: incomingFiles.length,
          })
        }
        return
      }

      // Track successful file upload
      trackBulkUpload(validFiles.length, 0) // We'll track total records later when processed

      setLocalFiles(validFiles)
      onFilesSelected(validFiles)
    },
    [disabled, maxFileSizeMB, multiple, onFilesSelected]
  )

  const handleFileInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      processFiles(event.target.files)
      // Reset input value to allow uploading the same file again if needed
      if (event.target) {
        event.target.value = ""
      }
    },
    [processFiles]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragging(false)

      if (disabled) {
        return
      }

      processFiles(event.dataTransfer.files)
    },
    [disabled, processFiles]
  )

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }, [])

  const handleDragEnter = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleBrowseClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }, [])

  return (
    <div className={cn("space-y-4", className)}>
      <div
        role="button"
        tabIndex={0}
        aria-disabled={disabled}
        aria-label="Drop CSV or Excel files here, or press Enter to browse files"
        onClick={handleBrowseClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            handleBrowseClick()
          }
        }}
        onDrop={handleDrop}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          disabled
            ? "cursor-not-allowed border-muted opacity-60"
            : "cursor-pointer border-muted-foreground/40 hover:border-primary focus:border-primary",
          isDragging && !disabled
            ? "border-primary bg-primary/5 text-primary"
            : "bg-muted/30"
        )}
      >
        <UploadCloud className="mb-4 h-10 w-10" aria-hidden />
        <div className="space-y-2">
          <p className="text-lg font-semibold">
            Drag and drop CSV or Excel files here
          </p>
          <p className="text-sm text-muted-foreground">
            Supported formats: .csv, .xls, .xlsx · Max size {maxFileSizeMB} MB{" "}
            {multiple ? "per file" : ""}
          </p>
        </div>
        <div>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <FileSpreadsheet className="h-4 w-4" aria-hidden />
            Browse files
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={handleFileInputChange}
          disabled={disabled}
        />
      </div>

      {localFiles.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Selected files
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {localFiles.map((file) => (
              <li
                key={`${file.name}-${file.lastModified}`}
                className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2"
              >
                <span className="truncate">{file.name}</span>
                <span className="ml-4 shrink-0 text-muted-foreground">
                  {file.size} bytes
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errorMessages.length > 0 && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
        >
          <AlertCircle className="h-5 w-5 shrink-0" aria-hidden />
          <div className="space-y-1">
            {errorMessages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {disabled && <Spinner className="h-4 w-4" aria-hidden />}
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  )
}