
import React from 'react';
import { CodedResponse, CodeframeEntry } from '../../types';
import { getQuestionTypeName } from '../../utils/questionTypes';

interface CodedResponsesTableProps {
  responses: CodedResponse[];
  hasMultipleCodeframes: boolean;
  codeframe: CodeframeEntry[];
  multipleCodeframes?: Record<string, any>;
}

const CodedResponsesTable: React.FC<CodedResponsesTableProps> = ({ 
  responses, 
  hasMultipleCodeframes, 
  codeframe, 
  multipleCodeframes 
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="excel-table">
        <thead>
          <tr>
            <th>Response</th>
            <th>Column</th>
            {hasMultipleCodeframes && <th>Question Type</th>}
            <th>Assigned Codes</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((response, index) => {
            // Determine question type for this response
            let questionType = 'miscellaneous';
            if (hasMultipleCodeframes && response.columnIndex !== undefined && multipleCodeframes) {
              questionType = Object.keys(multipleCodeframes).find(type => 
                multipleCodeframes[type].codeframe.some(
                  (code: any) => response.codesAssigned.includes(code.code)
                )
              ) || 'miscellaneous';
            }
            
            return (
              <tr key={index}>
                <td className="max-w-[350px]">
                  <div className="line-clamp-2">{response.responseText}</div>
                </td>
                <td className="whitespace-nowrap">
                  {response.columnName || 'Unknown'}
                </td>
                {hasMultipleCodeframes && (
                  <td className="whitespace-nowrap">
                    {getQuestionTypeName(questionType)}
                  </td>
                )}
                <td>
                  <div className="flex flex-wrap gap-1">
                    {response.codesAssigned.map(code => {
                      // Find the appropriate codeframe to get the code details
                      let codeEntry;
                      
                      if (hasMultipleCodeframes && multipleCodeframes) {
                        // Look for the code in the corresponding question type codeframe
                        Object.values(multipleCodeframes).forEach((typeData: any) => {
                          const found = typeData.codeframe.find((c: any) => c.code === code);
                          if (found) codeEntry = found;
                        });
                      } else {
                        codeEntry = codeframe.find(c => c.code === code);
                      }
                      
                      return (
                        <span 
                          key={code} 
                          className="bg-primary/10 text-primary text-xs rounded px-2 py-0.5"
                          title={codeEntry?.label || code}
                        >
                          {codeEntry?.numeric || code}
                        </span>
                      );
                    })}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {responses.length === 0 && (
        <div className="py-8 text-center text-muted-foreground">
          No responses match your filters
        </div>
      )}
    </div>
  );
};

export default CodedResponsesTable;
