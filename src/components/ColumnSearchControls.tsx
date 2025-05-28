
import React from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Search, CheckSquare } from 'lucide-react';
import { ColumnInfo } from '../types';

interface ColumnSearchControlsProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filteredColumns: ColumnInfo[];
  selectedColumns: number[];
  onSelectAllFiltered: () => void;
}

const ColumnSearchControls: React.FC<ColumnSearchControlsProps> = ({
  searchQuery,
  onSearchChange,
  filteredColumns,
  selectedColumns,
  onSelectAllFiltered
}) => {
  // Check if all filtered columns are already selected
  const areAllFilteredSelected = filteredColumns.length > 0 &&
    filteredColumns.every(col => selectedColumns.includes(col.index));

  return (
    <div className="flex items-center gap-4 mt-4">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search columns..."
          className="pl-8"
          value={searchQuery}
          onChange={onSearchChange}
        />
      </div>
      
      {filteredColumns.length > 0 && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAllFiltered}
          className="shrink-0 flex items-center gap-1"
        >
          <CheckSquare className="h-4 w-4" />
          <span>{areAllFilteredSelected ? "Deselect All" : "Select All"}</span>
        </Button>
      )}
    </div>
  );
};

export default ColumnSearchControls;
