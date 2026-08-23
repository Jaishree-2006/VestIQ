/**
 * Client-side CAS file pre-validation.
 *
 * Runs BEFORE the upload starts to give instant feedback.
 * Note: These checks match server-side enforcement in llm_proxy.js — the
 * server always re-validates regardless of whether the client checked.
 */

export type CasFileValidationError =
  | { kind: 'empty'; message: string }
  | { kind: 'too_large'; message: string; sizeMb: number }
  | { kind: 'wrong_type'; message: string; detectedSignature: string };

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB — must match server limit

/**
 * Reads the first N bytes of a File without loading it entirely into memory.
 */
function readFirstBytes(file: File, n: number): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const slice = file.slice(0, n);
    const reader = new FileReader();
    reader.onload = () => {
      const buf = reader.result as ArrayBuffer;
      resolve(new Uint8Array(buf));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(slice);
  });
}

/**
 * Converts the first N bytes to a printable hex string for diagnostics.
 */
function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join(' ');
}

/**
 * Validates a File object before uploading it as a CAS statement.
 *
 * Returns null if the file is valid, or a typed error object describing
 * exactly what is wrong. Never throws.
 */
export async function validateCasFile(
  file: File
): Promise<CasFileValidationError | null> {
  // 1. Zero-byte guard
  if (file.size === 0) {
    return {
      kind: 'empty',
      message:
        'The selected file is empty (0 bytes). Please choose a valid CAS statement PDF.',
    };
  }

  // 2. Size limit check — instant, no I/O needed
  if (file.size > MAX_FILE_BYTES) {
    const sizeMb = file.size / 1024 / 1024;
    return {
      kind: 'too_large',
      sizeMb,
      message: `File too large (${sizeMb.toFixed(1)} MB). CAS statements must be under 10 MB. Please check you have selected the correct file.`,
    };
  }

  // 3. Magic-bytes check — read first 5 bytes to confirm genuine PDF signature
  //    %PDF- in ASCII = 0x25 0x50 0x44 0x46 0x2D
  //    This cannot be spoofed by renaming a file or faking the MIME header.
  try {
    const header = await readFirstBytes(file, 5);
    const isPdf =
      header[0] === 0x25 && // %
      header[1] === 0x50 && // P
      header[2] === 0x44 && // D
      header[3] === 0x46 && // F
      header[4] === 0x2d;   // -

    if (!isPdf) {
      const detectedSignature = toHex(header);
      return {
        kind: 'wrong_type',
        detectedSignature,
        message:
          'Invalid file type. Only genuine PDF files are accepted. Renaming a non-PDF file to .pdf is not sufficient — the file must actually be a PDF.',
      };
    }
  } catch {
    // If we can't read the file at all, let the server handle it
    return null;
  }

  return null; // All checks passed
}

/**
 * Returns a user-facing error title for a CasFileValidationError kind.
 */
export function casValidationErrorTitle(kind: CasFileValidationError['kind']): string {
  switch (kind) {
    case 'empty':
      return 'Empty file';
    case 'too_large':
      return 'File too large';
    case 'wrong_type':
      return 'Invalid file type';
  }
}
