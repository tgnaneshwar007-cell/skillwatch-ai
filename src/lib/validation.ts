/**
 * SkillWatch AI — Validation Utilities
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateSessionToken(token: string): ValidationResult {
  if (!token || typeof token !== 'string') {
    return { isValid: false, error: 'Session token is required.' };
  }
  const clean = token.trim();
  if (clean.length < 6) {
    return { isValid: false, error: 'Session token must be at least 6 characters.' };
  }
  return { isValid: true };
}

export function validateTraineeId(traineeId: string): ValidationResult {
  if (!traineeId || !traineeId.trim()) {
    return { isValid: false, error: 'Trainee ID (e.g. National Skill ID or Batch Roll No.) is required.' };
  }
  if (traineeId.trim().length < 3) {
    return { isValid: false, error: 'Trainee ID must be at least 3 characters long.' };
  }
  return { isValid: true };
}

export function isSessionExpired(expiresAtIso: string): boolean {
  try {
    const expiry = new Date(expiresAtIso).getTime();
    return Date.now() > expiry;
  } catch {
    return true;
  }
}

export function validateEvidenceFile(file: File): ValidationResult {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  const maxBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file format (${file.type}). Please upload a JPEG, PNG, WEBP photo or PDF document.`,
    };
  }

  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `File size exceeds the 5MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB). Please compress the photo.`,
    };
  }

  return { isValid: true };
}

