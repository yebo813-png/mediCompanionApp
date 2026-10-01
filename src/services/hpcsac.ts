import { createHash } from 'crypto';

export interface HpcsacEntry {
  id: string;
  timestamp: string;
  doctor: string;
  hpcsaNumber: string;
  patientName: string;
  patientId: string;
  entryType: 'consultation' | 'prescription' | 'referral' | 'note' | 'amendment';
  title: string;
  content: string;
  hash: string;
  previousHash: string;
  immutable: boolean;
}

export interface AuditLog {
  entries: HpcsacEntry[];
  totalEntries: number;
  lastUpdated: string;
}

const STORAGE_KEY = 'mmmedi_hpcsac_audit_log';
const DOCTOR_NAME = 'Dr. Thabo Ndlovu';
const HPCSA_NUMBER = 'HP-123456';

function computeHash(content: string, previousHash: string): string {
  const data = `${content}|${previousHash}|${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const chr = data.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

export function getAuditLog(): AuditLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const log = JSON.parse(raw) as AuditLog;
      return { ...log, lastUpdated: log.lastUpdated };
    }
  } catch { /* ignore */ }
  return { entries: [], totalEntries: 0, lastUpdated: '' };
}

export function logHpcsacEntry(
  patientName: string,
  patientId: string,
  entryType: HpcsacEntry['entryType'],
  title: string,
  content: string
): HpcsacEntry {
  const log = getAuditLog();
  const previousHash = log.entries.length > 0 ? log.entries[log.entries.length - 1].hash : 'GENESIS';
  const now = new Date();
  const timestamp = now.toISOString();
  const entryContent = `${patientName}|${entryType}|${title}|${content}`;
  const hash = computeHash(entryContent, previousHash);

  const entry: HpcsacEntry = {
    id: `hpcsac-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    doctor: DOCTOR_NAME,
    hpcsaNumber: HPCSA_NUMBER,
    patientName,
    patientId,
    entryType,
    title,
    content,
    hash,
    previousHash,
    immutable: true,
  };

  const newLog: AuditLog = {
    entries: [...log.entries, entry],
    totalEntries: log.entries.length + 1,
    lastUpdated: timestamp,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(newLog));
  return entry;
}

export function verifyChainIntegrity(): { valid: boolean; brokenAt: number | null } {
  const log = getAuditLog();
  for (let i = 0; i < log.entries.length; i++) {
    const entry = log.entries[i];
    const prevHash = i === 0 ? 'GENESIS' : log.entries[i - 1].hash;
    const content = `${entry.patientName}|${entry.entryType}|${entry.title}|${entry.content}`;
    const expectedHash = computeHash(content, prevHash);
    if (entry.previousHash !== prevHash || entry.hash !== expectedHash) {
      return { valid: false, brokenAt: i };
    }
  }
  return { valid: true, brokenAt: null };
}

export function getEntriesForPatient(patientId: string): HpcsacEntry[] {
  const log = getAuditLog();
  return log.entries.filter((e) => e.patientId === patientId);
}

export function exportAuditReport(patientId?: string): string {
  const log = getAuditLog();
  const entries = patientId ? log.entries.filter((e) => e.patientId === patientId) : log.entries;
  const integrity = verifyChainIntegrity();

  let report = `HPCSA COMPLIANCE AUDIT REPORT\n`;
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Practitioner: ${DOCTOR_NAME} (HPCSA: ${HPCSA_NUMBER})\n`;
  report += `Chain Integrity: ${integrity.valid ? 'VALID' : `BROKEN at entry ${integrity.brokenAt}`}\n`;
  report += `Total Entries: ${entries.length}\n`;
  report += `${'='.repeat(60)}\n\n`;

  for (const entry of entries) {
    report += `[${entry.timestamp}]\n`;
    report += `  Type: ${entry.entryType.toUpperCase()}\n`;
    report += `  Patient: ${entry.patientName}\n`;
    report += `  Title: ${entry.title}\n`;
    report += `  Hash: ${entry.hash}\n`;
    report += `  Prev: ${entry.previousHash}\n`;
    report += `  Content: ${entry.content.slice(0, 200)}${entry.content.length > 200 ? '...' : ''}\n`;
    report += `${'-'.repeat(60)}\n\n`;
  }

  return report;
}
