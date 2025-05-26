
import { useState } from 'react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ColumnInfo } from '../types';
import { debugLog } from '../utils/debug';
import { getColumnNames, analyzeColumns } from './useColumnAnalysis';

export const useFileParsing = () => {
  const [isUploading, setIsUploading] = useState(false);

  const parseExcelFile = async (file: File): Promise<{ columns: ColumnInfo[], responses: string[], rawData: any[][] }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          debugLog("Reading Excel file data...");
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          debugLog("Available sheets:", workbook.SheetNames);
          
          if (workbook.SheetNames.length === 0) {
            reject(new Error('No worksheets found in the Excel file'));
            return;
          }
          
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          debugLog("Worksheet range:", worksheet['!ref']);
          
          const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
          
          debugLog("Excel rows found:", jsonData.length);
          
          if (jsonData.length === 0) {
            reject(new Error('No data rows found in the Excel file'));
            return;
          }
          
          const headers = jsonData.length > 0 && Array.isArray(jsonData[0]) 
            ? jsonData[0].map(String)
            : null;
            
          const hasHeaders = headers && headers.some(header => 
            typeof header === 'string' && 
            header.trim().length > 0 && 
            /^[A-Za-z\s_\-0-9?]+$/.test(header)
          );
          
          const dataRows = hasHeaders ? jsonData.slice(1) : jsonData;
          
          const rawData: any[][] = [];
          if (hasHeaders && Array.isArray(jsonData[0])) {
            rawData.push(jsonData[0]);
          }
          if (Array.isArray(dataRows)) {
            dataRows.forEach(row => {
              if (Array.isArray(row)) {
                rawData.push(row);
              }
            });
          }
          
          const columnCount = Math.max(...dataRows.map((row: any) => 
            Array.isArray(row) ? row.length : 0
          ));
          
          const columns: any[][] = Array(columnCount).fill(0).map(() => []);
          
          dataRows.forEach((row: any) => {
            if (Array.isArray(row)) {
              for (let i = 0; i < columnCount; i++) {
                if (i < row.length) {
                  columns[i].push(row[i]);
                } else {
                  columns[i].push("");
                }
              }
            }
          });
          
          const columnNames = getColumnNames(
            hasHeaders ? headers : null, 
            columnCount
          );
          
          const { columnInfos, textResponses } = analyzeColumns(columns, columnNames);
          
          debugLog(`Found ${columnInfos.length} columns, but none automatically selected`);
          
          resolve({ 
            columns: columnInfos,
            responses: textResponses,
            rawData
          });
        } catch (error) {
          console.error("Excel parsing error:", error);
          reject(new Error(`Error parsing Excel file: ${error instanceof Error ? error.message : "Unknown error"}`));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  const parseCSVFile = async (file: File): Promise<{ columns: ColumnInfo[], responses: string[], rawData: any[][] }> => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            debugLog("CSV parsing results:", results);
            
            if (!results.data || results.data.length === 0) {
              reject(new Error('No data found in the CSV file'));
              return;
            }
            
            const rawData: any[][] = [];
            if (Array.isArray(results.data)) {
              results.data.forEach(row => {
                if (Array.isArray(row)) {
                  rawData.push(row);
                }
              });
            }
            
            const firstRow = results.data[0] as any[];
            const hasHeaders = firstRow.some(cell => 
              typeof cell === 'string' && 
              cell.trim().length > 0 && 
              /^[A-Za-z\s_\-0-9?]+$/.test(cell)
            );
            
            const headers = hasHeaders ? firstRow.map(String) : null;
            const dataRows = hasHeaders ? results.data.slice(1) : results.data;
            
            const columnCount = Math.max(...dataRows.map((row: any) => 
              Array.isArray(row) ? row.length : 0
            ));
            
            const columns: any[][] = Array(columnCount).fill(0).map(() => []);
            
            dataRows.forEach((row: any) => {
              if (Array.isArray(row)) {
                for (let i = 0; i < columnCount; i++) {
                  if (i < row.length) {
                    columns[i].push(row[i]);
                  } else {
                    columns[i].push("");
                  }
                }
              }
            });
            
            const columnNames = getColumnNames(
              hasHeaders ? headers : null, 
              columnCount
            );
            
            const { columnInfos, textResponses } = analyzeColumns(columns, columnNames);
            
            debugLog(`Found ${columnInfos.length} columns, but none automatically selected`);
            
            resolve({ 
              columns: columnInfos,
              responses: textResponses,
              rawData
            });
          } catch (error) {
            console.error("CSV parsing error:", error);
            reject(new Error(`Error parsing CSV: ${error instanceof Error ? error.message : "Unknown error"}`));
          }
        },
        error: (error) => {
          console.error("PapaParse error:", error);
          reject(new Error(`Error parsing CSV: ${error.message}`));
        }
      });
    });
  };

  return {
    isUploading,
    setIsUploading,
    parseExcelFile,
    parseCSVFile
  };
};
