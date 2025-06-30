import { ShareButton } from "../ShareButton";

interface CompletionStatusProps {
  isExecutionComplete: boolean;
  shareUrl: string | null;
  saving: boolean;
}

export function CompletionStatus({ isExecutionComplete, shareUrl, saving }: CompletionStatusProps) {
  if (!isExecutionComplete) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-green-800">✅ Execution Complete</h4>
          <p className="text-sm text-green-600">
            {shareUrl ? (
              <>
                Your result has been saved and is ready to share
                {process.env.NODE_ENV === "development" && " (using mock data)"}
              </>
            ) : saving ? (
              "Saving result..."
            ) : (
              "Result completed successfully"
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shareUrl && <ShareButton shareUrl={shareUrl} />}
          {saving && (
            <div className="animate-spin h-4 w-4 border-2 border-green-500 border-t-transparent rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
}
