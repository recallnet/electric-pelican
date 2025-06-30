import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProgressHeaderProps {
  isExecuting: boolean;
  onCancel: () => void;
}

export function ProgressHeader({ isExecuting, onCancel }: ProgressHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Execution Progress</h3>
      {isExecuting && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      )}
    </div>
  );
}
