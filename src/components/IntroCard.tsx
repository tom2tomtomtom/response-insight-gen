import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { FileText, FileCode, Table, CheckSquare } from 'lucide-react';
const IntroCard: React.FC = () => {
  return <Card className="w-full">
      <CardHeader className="bg-gradient-to-r from-primary to-secondary text-white">
        <CardTitle className="text-2xl">Welcome to monigle codify</CardTitle>
        <CardDescription className="text-white/90">
          AI-Powered Analysis for Open-Ended Survey Responses
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">How It Works</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="mt-0.5">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span>Upload an Excel file containing your survey responses</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5">
                  <FileCode className="h-5 w-5 text-primary" />
                </div>
                <span>Our AI analyzes responses and creates a structured codeframe</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5">
                  <Table className="h-5 w-5 text-primary" />
                </div>
                <span>Each response is mapped to relevant codes from the codeframe</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="mt-0.5">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <span>Download the complete analysis as an Excel file with two sheets</span>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Features</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm">Theme Detection</p>
                <p className="text-xs text-muted-foreground">Automatically group responses into meaningful themes</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm">Code Definition</p>
                <p className="text-xs text-muted-foreground">Clear descriptions with examples for each code</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm">Multi-Code</p>
                <p className="text-xs text-muted-foreground">Assign multiple relevant codes to each response</p>
              </div>
              <div className="bg-muted rounded-lg p-3">
                <p className="font-medium text-sm">Excel Output</p>
                <p className="text-xs text-muted-foreground">Fully formatted results ready for analysis</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default IntroCard;