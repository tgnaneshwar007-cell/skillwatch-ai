// SkillWatch AI — Core Logic & Business Rule Automated Verification Suite

import assert from 'assert';
import { calculateComplianceScore, calculateAttendanceRate } from '../src/lib/calculations.js';
import { validateSessionToken, validateTraineeId, isSessionExpired, validateEvidenceFile } from '../src/lib/validation.js';

console.log('========================================================================');
console.log('SkillWatch AI (SIH26245) — Automated Verification Test Suite');
console.log('========================================================================\n');

// 1. Transparent Compliance Calculation Verification
console.log('Test 1: Transparent Compliance Score Calculation...');
const mockItems = [
  { status: 'compliant' },
  { status: 'compliant' },
  { status: 'compliant' },
  { status: 'non_compliant' }, // 1 defect
  { status: 'needs_review' },
  { status: 'not_inspected' }, // should be excluded from applicable denominator
];

const complianceResult = calculateComplianceScore(mockItems);
// Inspected applicable = 3 compliant + 1 non_compliant + 1 needs_review = 5
// Compliant = 3. Expected = (3 / 5) * 100 = 60.0%
assert.strictEqual(complianceResult.inspectedCount, 5, 'Inspected applicable items must be 5');
assert.strictEqual(complianceResult.compliantCount, 3, 'Compliant items must be 3');
assert.strictEqual(complianceResult.percentage, 60.0, 'Compliance percentage must equal 60.0%');
console.log('  ✓ Compliance formula passed: 3/5 applicable items = 60.0%');

// Test "Not assessed" when 0 items inspected
const uninspectedItems = [{ status: 'not_inspected' }, { status: 'not_inspected' }];
const unassessedResult = calculateComplianceScore(uninspectedItems);
assert.strictEqual(unassessedResult.percentage, null, 'Must return null when 0 items inspected');
assert.strictEqual(unassessedResult.formatted, 'Not assessed', 'Must display "Not assessed"');
console.log('  ✓ Zero inspection handling passed: returns "Not assessed"');

// 2. Attendance Rate Calculation & Deficit Flagging
console.log('\nTest 2: Attendance Rate & 70% Deficit Rule...');
const normalAttendance = calculateAttendanceRate(25, 30); // 83%
assert.strictEqual(normalAttendance.rate, 83);
assert.strictEqual(normalAttendance.isDeficit, false, '83% should not trigger deficit alert');

const lowAttendance = calculateAttendanceRate(12, 30); // 40%
assert.strictEqual(lowAttendance.rate, 40);
assert.strictEqual(lowAttendance.isDeficit, true, '40% must trigger deficit alert (< 70%)');
console.log('  ✓ Attendance deficit rule passed: triggers alert when attendance < 70%');

// 3. Session Expiration & Token Validation
console.log('\nTest 3: Session Expiration & Token Validation...');
const futureDate = new Date(Date.now() + 60 * 60 * 1000).toISOString();
const pastDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();

assert.strictEqual(isSessionExpired(futureDate), false, 'Future session must be active');
assert.strictEqual(isSessionExpired(pastDate), true, 'Past session must be detected as expired');
assert.strictEqual(validateSessionToken('SKILL-123456').isValid, true, 'Valid token accepted');
assert.strictEqual(validateSessionToken('   ').isValid, false, 'Empty token rejected');
console.log('  ✓ Session expiration & token validation passed');

// 4. File Evidence Validation
console.log('\nTest 4: File Evidence Size & Format Validation...');
const validFile = { type: 'image/jpeg', size: 2 * 1024 * 1024 }; // 2MB
const oversizeFile = { type: 'image/jpeg', size: 8 * 1024 * 1024 }; // 8MB (> 5MB)
const invalidMimeFile = { type: 'video/mp4', size: 1024 * 1024 };

assert.strictEqual(validateEvidenceFile(validFile).isValid, true, 'Valid JPEG under 5MB accepted');
assert.strictEqual(validateEvidenceFile(oversizeFile).isValid, false, 'File > 5MB rejected');
assert.strictEqual(validateEvidenceFile(invalidMimeFile).isValid, false, 'Invalid mime type rejected');
console.log('  ✓ File evidence guard passed (JPEG/PNG/WEBP/PDF allowed, max 5MB)');

console.log('\n========================================================================');
console.log('ALL WORKFLOW & ALGORITHM TESTS PASSED SUCCESSFULLY! (4/4 test suites)');
console.log('========================================================================\n');

