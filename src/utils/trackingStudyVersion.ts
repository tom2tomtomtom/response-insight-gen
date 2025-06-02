import { ProcessedResult, CodeframeEntry } from '../types';

export interface StudyVersion {
  id: string;
  versionNumber: number;
  studyId: string;
  projectName: string;
  createdAt: Date;
  wave: string; // e.g., "Q1 2024", "Wave 1", "Jan 2024"
  description?: string;
  metadata: {
    totalResponses: number;
    columnsProcessed: number;
    codeframeSize: number;
    processingDate: Date;
  };
  codeframeSnapshot: CodeframeEntry[];
  changesSummary?: VersionChanges;
}

export interface VersionChanges {
  newCodes: string[];
  removedCodes: string[];
  modifiedCodes: Array<{
    code: string;
    changes: string[];
  }>;
  percentageChanges: Array<{
    code: string;
    previousPercentage: number;
    currentPercentage: number;
    delta: number;
  }>;
}

export interface TrackingStudyConfig {
  studyId: string;
  studyName: string;
  isTrackingStudy: boolean;
  baselineVersion?: string;
  comparisonMode: 'wave-over-wave' | 'vs-baseline' | 'all-waves';
  autoDetectChanges: boolean;
  significanceThreshold: number; // percentage point change considered significant
}

export class TrackingStudyManager {
  private static STORAGE_KEY = 'tracking-study-versions';
  
  /**
   * Save a new version of a tracking study
   */
  static saveVersion(
    results: ProcessedResult,
    projectName: string,
    wave: string,
    config: TrackingStudyConfig,
    description?: string
  ): StudyVersion {
    const versions = this.getAllVersions();
    const studyVersions = versions.filter(v => v.studyId === config.studyId);
    
    const newVersion: StudyVersion = {
      id: `${config.studyId}_v${studyVersions.length + 1}_${Date.now()}`,
      versionNumber: studyVersions.length + 1,
      studyId: config.studyId,
      projectName,
      createdAt: new Date(),
      wave,
      description,
      metadata: {
        totalResponses: results.codedResponses.length,
        columnsProcessed: new Set(results.codedResponses.map(r => r.columnName)).size,
        codeframeSize: results.codeframe.length,
        processingDate: new Date()
      },
      codeframeSnapshot: JSON.parse(JSON.stringify(results.codeframe)) // Deep copy
    };
    
    // Calculate changes if there's a previous version
    if (studyVersions.length > 0) {
      const previousVersion = this.getPreviousVersion(config, studyVersions);
      if (previousVersion) {
        newVersion.changesSummary = this.calculateChanges(
          previousVersion.codeframeSnapshot,
          results.codeframe,
          config.significanceThreshold
        );
      }
    }
    
    versions.push(newVersion);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versions));
    
    return newVersion;
  }
  
  /**
   * Get all versions for a study
   */
  static getStudyVersions(studyId: string): StudyVersion[] {
    const versions = this.getAllVersions();
    return versions
      .filter(v => v.studyId === studyId)
      .sort((a, b) => a.versionNumber - b.versionNumber);
  }
  
  /**
   * Get all stored versions
   */
  private static getAllVersions(): StudyVersion[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    
    return JSON.parse(stored).map((v: any) => ({
      ...v,
      createdAt: new Date(v.createdAt)
    }));
  }
  
  /**
   * Get the appropriate previous version based on comparison mode
   */
  private static getPreviousVersion(
    config: TrackingStudyConfig,
    studyVersions: StudyVersion[]
  ): StudyVersion | null {
    if (studyVersions.length === 0) return null;
    
    switch (config.comparisonMode) {
      case 'vs-baseline':
        return studyVersions.find(v => v.id === config.baselineVersion) || studyVersions[0];
      case 'wave-over-wave':
        return studyVersions[studyVersions.length - 1];
      default:
        return studyVersions[studyVersions.length - 1];
    }
  }
  
  /**
   * Calculate changes between two codeframe versions
   */
  private static calculateChanges(
    previousCodeframe: CodeframeEntry[],
    currentCodeframe: CodeframeEntry[],
    significanceThreshold: number
  ): VersionChanges {
    const prevCodes = new Map(previousCodeframe.map(c => [c.code, c]));
    const currCodes = new Map(currentCodeframe.map(c => [c.code, c]));
    
    const newCodes: string[] = [];
    const removedCodes: string[] = [];
    const modifiedCodes: Array<{ code: string; changes: string[] }> = [];
    const percentageChanges: Array<{
      code: string;
      previousPercentage: number;
      currentPercentage: number;
      delta: number;
    }> = [];
    
    // Check for new and modified codes
    currCodes.forEach((currCode, code) => {
      const prevCode = prevCodes.get(code);
      
      if (!prevCode) {
        newCodes.push(code);
      } else {
        // Check for modifications
        const changes: string[] = [];
        
        if (prevCode.label !== currCode.label) {
          changes.push(`Label changed from "${prevCode.label}" to "${currCode.label}"`);
        }
        
        if (prevCode.definition !== currCode.definition) {
          changes.push('Definition updated');
        }
        
        if (changes.length > 0) {
          modifiedCodes.push({ code, changes });
        }
        
        // Check for significant percentage changes
        const prevPct = prevCode.percentage || 0;
        const currPct = currCode.percentage || 0;
        const delta = currPct - prevPct;
        
        if (Math.abs(delta) >= significanceThreshold) {
          percentageChanges.push({
            code,
            previousPercentage: prevPct,
            currentPercentage: currPct,
            delta
          });
        }
      }
    });
    
    // Check for removed codes
    prevCodes.forEach((_, code) => {
      if (!currCodes.has(code)) {
        removedCodes.push(code);
      }
    });
    
    // Sort percentage changes by absolute delta
    percentageChanges.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    
    return {
      newCodes,
      removedCodes,
      modifiedCodes,
      percentageChanges
    };
  }
  
  /**
   * Generate a comparison report between versions
   */
  static generateComparisonReport(
    version1: StudyVersion,
    version2: StudyVersion
  ): string {
    const changes = this.calculateChanges(
      version1.codeframeSnapshot,
      version2.codeframeSnapshot,
      5 // 5% threshold
    );
    
    const lines: string[] = [
      'TRACKING STUDY COMPARISON REPORT',
      '=' .repeat(50),
      '',
      `Study: ${version2.projectName}`,
      `Comparing: ${version1.wave} → ${version2.wave}`,
      `Date Range: ${version1.createdAt.toLocaleDateString()} → ${version2.createdAt.toLocaleDateString()}`,
      '',
      'SUMMARY',
      '-'.repeat(20),
      `Total Responses: ${version1.metadata.totalResponses} → ${version2.metadata.totalResponses}`,
      `Codeframe Size: ${version1.metadata.codeframeSize} → ${version2.metadata.codeframeSize}`,
      ''
    ];
    
    if (changes.newCodes.length > 0) {
      lines.push('NEW CODES ADDED');
      lines.push('-'.repeat(20));
      changes.newCodes.forEach(code => {
        const codeEntry = version2.codeframeSnapshot.find(c => c.code === code);
        lines.push(`• ${codeEntry?.label || code} (${codeEntry?.percentage?.toFixed(1)}%)`);
      });
      lines.push('');
    }
    
    if (changes.removedCodes.length > 0) {
      lines.push('CODES REMOVED');
      lines.push('-'.repeat(20));
      changes.removedCodes.forEach(code => {
        const codeEntry = version1.codeframeSnapshot.find(c => c.code === code);
        lines.push(`• ${codeEntry?.label || code}`);
      });
      lines.push('');
    }
    
    if (changes.percentageChanges.length > 0) {
      lines.push('SIGNIFICANT CHANGES (≥5% points)');
      lines.push('-'.repeat(20));
      changes.percentageChanges.forEach(change => {
        const codeEntry = version2.codeframeSnapshot.find(c => c.code === change.code);
        const arrow = change.delta > 0 ? '↑' : '↓';
        const color = change.delta > 0 ? '+' : '';
        lines.push(
          `• ${codeEntry?.label || change.code}: ${change.previousPercentage.toFixed(1)}% → ${change.currentPercentage.toFixed(1)}% (${color}${change.delta.toFixed(1)}% ${arrow})`
        );
      });
      lines.push('');
    }
    
    return lines.join('\n');
  }
  
  /**
   * Export tracking data for external analysis
   */
  static exportTrackingData(studyId: string): string {
    const versions = this.getStudyVersions(studyId);
    const headers = ['Wave', 'Date', 'Total Responses'];
    
    // Get all unique codes across versions
    const allCodes = new Set<string>();
    versions.forEach(v => {
      v.codeframeSnapshot.forEach(c => allCodes.add(c.code));
    });
    
    // Add code columns to headers
    const codeArray = Array.from(allCodes).sort();
    codeArray.forEach(code => {
      const codeEntry = versions[versions.length - 1]?.codeframeSnapshot.find(c => c.code === code);
      headers.push(codeEntry?.label || code);
    });
    
    // Build data rows
    const rows: string[][] = [headers];
    
    versions.forEach(version => {
      const row: string[] = [
        version.wave,
        version.createdAt.toLocaleDateString(),
        version.metadata.totalResponses.toString()
      ];
      
      // Add percentage for each code
      codeArray.forEach(code => {
        const codeEntry = version.codeframeSnapshot.find(c => c.code === code);
        row.push(codeEntry?.percentage?.toFixed(1) || '0.0');
      });
      
      rows.push(row);
    });
    
    // Convert to CSV
    return rows.map(row => row.join(',')).join('\n');
  }
}