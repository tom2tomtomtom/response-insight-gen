
import React, { useState } from 'react';
import { useProcessing } from '../contexts/ProcessingContext';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Upload, FileSpreadsheet, Save } from 'lucide-react';
import { CodeframeEntry, UploadedCodeframe } from '../types';
import * as XLSX from 'xlsx';
import { toast } from '../components/ui/use-toast';

const UploadCodeframe: React.FC = () => {
  const { saveUploadedCodeframe } = useProcessing();
  const navigate = useNavigate();
  const [codeframeName, setCodeframeName] = useState('');
  const [uploadedCodeframe, setUploadedCodeframe] = useState<CodeframeEntry[] | null>(null);
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
          toast({
            variant: "destructive",
            title: "Invalid file",
            description: "No worksheets found in the Excel file",
          });
          return;
        }
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to JSON with header option
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
        
        if (jsonData.length <= 1) {
          toast({
            variant: "destructive",
            title: "Invalid file",
            description: "No data rows found in the Excel file",
          });
          return;
        }
        
        // Check if the headers match what we expect
        const headers = jsonData[0] as string[];
        const requiredColumns = ['Code', 'Numeric', 'Label', 'Definition'];
        
        const missingColumns = requiredColumns.filter(col => 
          !headers.some(header => header.trim().toLowerCase() === col.toLowerCase())
        );
        
        if (missingColumns.length > 0) {
          toast({
            variant: "destructive",
            title: "Invalid file format",
            description: `Missing required columns: ${missingColumns.join(', ')}`,
          });
          return;
        }
        
        // Parse codeframe entries
        const codeframeEntries: CodeframeEntry[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i] as string[];
          if (row.length < 4) continue; // Skip rows without enough data
          
          const codeIndex = headers.findIndex(h => h.trim().toLowerCase() === 'code');
          const numericIndex = headers.findIndex(h => h.trim().toLowerCase() === 'numeric');
          const labelIndex = headers.findIndex(h => h.trim().toLowerCase() === 'label');
          const definitionIndex = headers.findIndex(h => h.trim().toLowerCase() === 'definition');
          
          if (row[codeIndex]) { // Only add if code exists
            codeframeEntries.push({
              code: row[codeIndex].toString(),
              numeric: row[numericIndex]?.toString() || '',
              label: row[labelIndex]?.toString() || '',
              definition: row[definitionIndex]?.toString() || '',
              examples: [] // No examples from upload, will add from real data
            });
          }
        }
        
        if (codeframeEntries.length === 0) {
          toast({
            variant: "destructive",
            title: "Invalid file",
            description: "No valid codeframe entries found",
          });
          return;
        }
        
        // Auto-generate name from filename if not set
        if (!codeframeName) {
          setCodeframeName(file.name.replace(/\.[^/.]+$/, ""));
        }
        
        setUploadedCodeframe(codeframeEntries);
        
        toast({
          title: "Codeframe loaded",
          description: `Successfully loaded ${codeframeEntries.length} codes`,
        });
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Error parsing file",
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  const handleDownloadTemplate = () => {
    // Create sample data for the template
    const templateData = [
      { Code: 'A1', Numeric: '1', Label: 'Quality', Definition: 'Mentions of product or service quality' },
      { Code: 'A2', Numeric: '2', Label: 'Value', Definition: 'References to price, cost, or value for money' },
      { Code: 'A3', Numeric: '3', Label: 'Service', Definition: 'Customer service experiences or interactions' },
      { Code: 'A4', Numeric: '4', Label: 'Innovation', Definition: 'New features, technology, or creative solutions' },
      { Code: 'A5', Numeric: '5', Label: 'Other', Definition: 'Responses that do not fit other categories' }
    ];
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Codeframe Template');
    
    // Add column widths for better readability
    ws['!cols'] = [
      { wch: 10 }, // Code
      { wch: 10 }, // Numeric
      { wch: 20 }, // Label
      { wch: 50 }  // Definition
    ];
    
    // Generate and download file
    XLSX.writeFile(wb, 'codeframe_template.xlsx');
    
    toast({
      title: "Template downloaded",
      description: "Use this template to structure your codeframe for upload",
    });
  };

  const handleSaveCodeframe = () => {
    if (!uploadedCodeframe || !codeframeName) {
      toast({
        variant: "destructive",
        title: "Cannot save",
        description: "Please upload a codeframe and provide a name",
      });
      return;
    }
    
    if (saveUploadedCodeframe) {
      saveUploadedCodeframe({
        name: codeframeName,
        entries: uploadedCodeframe
      });
      
      toast({
        title: "Codeframe saved",
        description: "The codeframe is now available for use in your analysis",
      });
      
      // Navigate back to main workflow after a short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Existing Codeframe</CardTitle>
            <CardDescription>
              Upload an Excel file containing your existing codeframe to use in analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Codeframe Name</label>
                <Input 
                  value={codeframeName} 
                  onChange={(e) => setCodeframeName(e.target.value)} 
                  placeholder="Enter a name for this codeframe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Upload File</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    id="codeframe-upload"
                    className="hidden"
                  />
                  <Button asChild variant="outline" className="w-full">
                    <label htmlFor="codeframe-upload" className="cursor-pointer flex items-center justify-center gap-2">
                      <Upload className="h-4 w-4" />
                      <span>Choose Excel File</span>
                    </label>
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <h3 className="text-md font-medium mb-2">Format Requirements:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Your Excel file should have the following columns:
              </p>
              <div className="bg-muted p-3 rounded-md text-sm">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Code</strong>: Text code identifier (e.g., A1, B2)</li>
                  <li><strong>Numeric</strong>: Numeric code identifier (e.g., 1, 2.1)</li>
                  <li><strong>Label</strong>: Short code name</li>
                  <li><strong>Definition</strong>: Full description of the code</li>
                </ul>
              </div>
            </div>
            
            {uploadedCodeframe && uploadedCodeframe.length > 0 && (
              <div className="pt-4">
                <h3 className="text-md font-medium mb-2">Preview:</h3>
                <div className="border rounded-md overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Numeric</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead className="hidden sm:table-cell">Definition</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {uploadedCodeframe.slice(0, 5).map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{entry.code}</TableCell>
                          <TableCell>{entry.numeric}</TableCell>
                          <TableCell>{entry.label}</TableCell>
                          <TableCell className="hidden sm:table-cell max-w-[300px] truncate">
                            {entry.definition}
                          </TableCell>
                        </TableRow>
                      ))}
                      {uploadedCodeframe.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                            + {uploadedCodeframe.length - 5} more codes
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleDownloadTemplate}>
              <FileSpreadsheet className="h-4 w-4 mr-2" /> 
              Download Template
            </Button>
            <Button 
              onClick={handleSaveCodeframe} 
              disabled={!uploadedCodeframe || !codeframeName}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Codeframe
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default UploadCodeframe;
