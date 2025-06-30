"use client";

import { ArrowRightIcon, CrownIcon, SwordIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ElectricButton } from "@/components/ui/electric-button";
import { ProcessedModel } from "@/types/models";

export interface SelectedModelsProps {
  /** Array of all available models */
  allModels: ProcessedModel[];
  /** IDs of selected contestant models */
  selectedContestants: string[];
  /** ID of selected judge model */
  selectedJudge: string | null;
  /** Maximum number of contestants allowed */
  maxContestants: number;
  /** Callback when contestant is removed */
  onRemoveContestant: (modelId: string) => void;
  /** Callback when judge is removed */
  onRemoveJudge: () => void;
  /** Optional callback when selection is complete */
  onSelectionComplete?: () => void;
}

/**
 * Display current selection of contestants and judge models.
 * Shows validation status and allows removal of selections.
 */
export function SelectedModels({
  allModels,
  selectedContestants,
  selectedJudge,
  maxContestants,
  onRemoveContestant,
  onRemoveJudge,
  onSelectionComplete,
}: SelectedModelsProps) {
  // Create lookup map for efficient model finding
  const modelMap = new Map(allModels.map((model) => [model.id, model]));

  const contestantModels = selectedContestants
    .map((id) => modelMap.get(id))
    .filter((model): model is ProcessedModel => !!model);

  const judgeModel = selectedJudge ? modelMap.get(selectedJudge) : null;

  const isValidSelection = selectedContestants.length === maxContestants && judgeModel;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Tournament Setup</h3>
        <Badge
          variant={isValidSelection ? "default" : "secondary"}
          className={isValidSelection ? "bg-green-500" : ""}
        >
          {isValidSelection ? "Ready" : "Incomplete"}
        </Badge>
      </div>

      {/* Contestants section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SwordIcon className="h-4 w-4 text-blue-600" />
          <h4 className="font-medium text-gray-700">
            Contestants ({selectedContestants.length}/{maxContestants})
          </h4>
        </div>

        {contestantModels.length > 0 ? (
          <div className="grid gap-2 grid-cols-1 sm:grid-cols-2">
            {contestantModels.map((model) => (
              <div
                key={model.id}
                className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                role="listitem"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-blue-900 truncate">{model.name}</p>
                  <p className="text-sm text-blue-700">{model.provider}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveContestant(model.id)}
                  aria-label={`Remove ${model.name} from contestants`}
                  className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No contestants selected</p>
        )}

        {selectedContestants.length < maxContestants && (
          <p className="text-xs text-gray-600">
            Select {maxContestants - selectedContestants.length} more model
            {maxContestants - selectedContestants.length === 1 ? "" : "s"} from the list below
          </p>
        )}
      </div>

      {/* Judge section */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <CrownIcon className="h-4 w-4 text-amber-600" />
          <h4 className="font-medium text-gray-700">Judge</h4>
        </div>

        {judgeModel ? (
          <div
            className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
            role="listitem"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-amber-900 truncate">{judgeModel.name}</p>
              <p className="text-sm text-amber-700">{judgeModel.provider}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveJudge}
              aria-label={`Remove ${judgeModel.name} as judge`}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : selectedJudge ? (
          <div
            className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg"
            role="listitem"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-amber-900 truncate">{selectedJudge}</p>
              <p className="text-sm text-amber-700">Model data not loaded</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveJudge}
              aria-label={`Remove ${selectedJudge} as judge`}
              className="text-amber-600 hover:text-amber-800 hover:bg-amber-100"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No judge selected</p>
        )}

        {!judgeModel && !selectedJudge && (
          <p className="text-xs text-gray-600">Select a judge model from the list below</p>
        )}
      </div>

      {/* Next button when selection is complete */}
      {isValidSelection && onSelectionComplete && (
        <div className="flex justify-center mt-6">
          <ElectricButton
            onClick={onSelectionComplete}
            className="w-full sm:w-auto text-lg font-semibold px-8 py-3"
          >
            <span className="flex items-center gap-2">
              Start Eval
              <ArrowRightIcon className="h-5 w-5" />
            </span>
          </ElectricButton>
        </div>
      )}

      {/* Validation messages */}
      {selectedContestants.length > 0 && !selectedJudge && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> You must select a judge model to proceed with the tournament.
          </p>
        </div>
      )}
    </div>
  );
}
