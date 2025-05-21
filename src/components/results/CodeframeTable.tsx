
import React from 'react';
import { CodeframeEntry } from '../../types';

interface CodeframeTableProps {
  codeframe: CodeframeEntry[];
}

const CodeframeTable: React.FC<CodeframeTableProps> = ({ codeframe }) => {
  return (
    <div className="overflow-x-auto">
      <table className="excel-table">
        <thead>
          <tr>
            <th>Code</th>
            <th>Numeric</th>
            <th>Label</th>
            <th>Definition</th>
            <th>Examples</th>
            <th>Count</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {codeframe.map((entry) => (
            <tr key={entry.code}>
              <td className="font-medium">{entry.code}</td>
              <td>{entry.numeric || '-'}</td>
              <td className="max-w-[150px] truncate">{entry.label}</td>
              <td className="max-w-[200px]">
                <div className="line-clamp-2">{entry.definition}</div>
              </td>
              <td>
                <ul className="list-disc list-inside">
                  {(entry.examples || []).slice(0, 2).map((example: string, i: number) => (
                    <li key={i} className="text-sm truncate max-w-[200px]">{example}</li>
                  ))}
                  {(entry.examples || []).length > 2 && (
                    <li className="text-xs text-muted-foreground">
                      +{(entry.examples || []).length - 2} more
                    </li>
                  )}
                </ul>
              </td>
              <td className="text-center">{entry.count || 0}</td>
              <td className="text-center">{entry.percentage ? `${entry.percentage.toFixed(1)}%` : '0%'}</td>
            </tr>
          ))}
          {!codeframe.some((code) => code.code === "Other") && (
            <tr>
              <td className="font-medium">Other</td>
              <td>0</td>
              <td>Other responses</td>
              <td>Responses that don't fit into the main categories</td>
              <td>-</td>
              <td className="text-center">0</td>
              <td className="text-center">0%</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CodeframeTable;
