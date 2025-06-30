/**
 * @file Models display component
 * @description Component for rendering models list with count and truncation
 */

import { formatModelName } from "./formatters";

/**
 * Render models list with count and truncation
 */
export function ModelsDisplay({ models = [] }: { models?: string[] }) {
  if (!models || models.length === 0) {
    return <span className="text-brand-gray-03 text-xs">No models</span>;
  }

  const displayModels = models.slice(0, 3);
  const hasMore = models.length > 3;

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-brand-black">
        {models.length} model{models.length !== 1 ? "s" : ""}
      </div>
      <div className="text-xs text-brand-gray-04">
        {displayModels.map((model) => (
          <div key={model} className="truncate">
            {formatModelName(model)}
          </div>
        ))}
        {hasMore && <div className="text-brand-gray-03 italic">+{models.length - 3} more...</div>}
      </div>
    </div>
  );
}
