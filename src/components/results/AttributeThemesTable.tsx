
import React from 'react';
import { AttributeTheme, CodeframeEntry } from '../../types';

interface AttributeThemesTableProps {
  themes: AttributeTheme;
  codeframe: CodeframeEntry[];
}

const AttributeThemesTable: React.FC<AttributeThemesTableProps> = ({ themes, codeframe }) => {
  return (
    <div className="mb-4 overflow-x-auto">
      <h3 className="text-sm font-medium mb-2">Attribute Themes</h3>
      <table className="excel-table mb-4">
        <thead>
          <tr>
            <th>Theme</th>
            <th>Attributes</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(themes).map(([theme, attributes]) => (
            <tr key={theme}>
              <td className="font-medium">{theme}</td>
              <td>
                <ul className="list-disc list-inside">
                  {(attributes as string[]).map(attr => {
                    const attrCode = codeframe.find((c) => c.code === attr);
                    return (
                      <li key={attr} className="text-sm">
                        {attrCode ? attrCode.label : attr}
                      </li>
                    );
                  })}
                </ul>
              </td>
              <td className="text-center">
                {(attributes as string[]).length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttributeThemesTable;
