
import React from 'react';
import { Card, CardContent } from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { ColumnInfo } from '../types';

interface ColumnCardProps {
  column: ColumnInfo;
  isSelected: boolean;
  onToggle: (columnIndex: number) => void;
}

const ColumnCard: React.FC<ColumnCardProps> = ({ column, isSelected, onToggle }) => {
  return (
    <Card
      className={`${
        column.type === 'text' ? 'bg-blue-50/50 border-blue-100' : 'bg-gray-50 border-gray-100'
      } ${isSelected ? 'ring-1 ring-primary' : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id={`column-${column.index}`}
            checked={isSelected}
            onCheckedChange={() => onToggle(column.index)}
            className="mt-1"
          />
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Label
                htmlFor={`column-${column.index}`}
                className="font-medium cursor-pointer"
              >
                {column.name || `Column ${column.index + 1}`}
              </Label>
              {column.type === 'text' && (
                <Badge variant="secondary" className="text-xs">Text</Badge>
              )}
              {column.type === 'mixed' && (
                <Badge variant="outline" className="text-xs">Mixed</Badge>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground">
              Example: {column.examples.length > 0 ? column.examples[0] : 'No data'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ColumnCard;
