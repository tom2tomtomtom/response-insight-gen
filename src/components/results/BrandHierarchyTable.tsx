
import React from 'react';
import { BrandHierarchy, CodeframeEntry } from '../../types';

interface BrandHierarchyTableProps {
  hierarchies: BrandHierarchy;
  codeframe: CodeframeEntry[];
}

const BrandHierarchyTable: React.FC<BrandHierarchyTableProps> = ({ hierarchies, codeframe }) => {
  return (
    <div className="mb-4 overflow-x-auto">
      <h3 className="text-sm font-medium mb-2">Brand Hierarchies</h3>
      <table className="excel-table mb-4">
        <thead>
          <tr>
            <th>Parent System</th>
            <th>Child Brands</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(hierarchies).map(([parent, children]) => (
            <tr key={parent}>
              <td className="font-medium">{parent}</td>
              <td>
                <ul className="list-disc list-inside">
                  {(children as string[]).map(child => {
                    const childCode = codeframe.find((c) => c.code === child);
                    return (
                      <li key={child} className="text-sm">
                        {childCode ? childCode.label : child}
                      </li>
                    );
                  })}
                </ul>
              </td>
              <td className="text-center">
                {(children as string[]).length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BrandHierarchyTable;
