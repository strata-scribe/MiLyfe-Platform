'use client';

interface ToolResultCardProps {
  toolName: string;
  result: any;
}

export function ToolResultCard({ toolName, result }: ToolResultCardProps) {
  if (!result) return null;

  switch (toolName) {
    case 'search_resources':
      return <ResourceResults result={result} />;
    case 'draft_thank':
      return <DraftThankResult result={result} />;
    case 'suggest_learn_path':
      return <LearnPathSuggestions result={result} />;
    case 'handoff_to_human':
      return <HandoffResult result={result} />;
    default:
      return (
        <div className="my-2 rounded-md border bg-muted/50 px-3 py-2 text-xs">
          <span className="font-medium">Tool: {toolName}</span>
          <pre className="mt-1 text-muted-foreground">{JSON.stringify(result, null, 2)}</pre>
        </div>
      );
  }
}

function ResourceResults({ result }: { result: any }) {
  if (!result.resources?.length) {
    return (
      <div className="my-2 rounded-md border px-3 py-2 text-xs text-muted-foreground">
        No resources found for this category.
      </div>
    );
  }

  return (
    <div className="my-2 space-y-1.5">
      {result.resources.map((r: any, i: number) => (
        <div key={i} className="rounded-md border px-3 py-2">
          <p className="text-sm font-medium">{r.name}</p>
          {r.address && <p className="text-xs text-muted-foreground">📍 {r.address}</p>}
          {r.phone && (
            <a href={`tel:${r.phone}`} className="text-xs text-primary hover:underline">
              📞 {r.phone}
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function DraftThankResult({ result }: { result: any }) {
  if (result.error) {
    return (
      <div className="my-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {result.error}
      </div>
    );
  }

  return (
    <div className="my-2 rounded-md border-2 border-green-200 bg-green-50 px-4 py-3">
      <p className="text-sm font-medium text-green-800">💸 Payment Draft</p>
      <p className="mt-1 text-sm text-green-700">
        Send {result.amount} $MLY to {result.recipient_name} for "{result.reason}"
      </p>
      <div className="mt-2 flex gap-2">
        <a
          href={result.confirm_url || '/wallet'}
          className="rounded-md bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Confirm & Send
        </a>
        <span className="text-xs text-green-600 self-center">or say "cancel"</span>
      </div>
    </div>
  );
}

function LearnPathSuggestions({ result }: { result: any }) {
  const paths = result.paths || result.suggestions || [];
  if (!paths.length) {
    return <div className="my-2 text-xs text-muted-foreground">No matching paths found.</div>;
  }

  return (
    <div className="my-2 space-y-1.5">
      {paths.map((p: any, i: number) => (
        <a
          key={i}
          href={`/learn/${p.slug}`}
          className="block rounded-md border px-3 py-2 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span>{p.icon}</span>
            <span className="text-sm font-medium">{p.title}</span>
            <span className="text-xs text-muted-foreground ml-auto">{p.duration_weeks}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description}</p>
        </a>
      ))}
    </div>
  );
}

function HandoffResult({ result }: { result: any }) {
  return (
    <div className="my-2 rounded-md border-2 border-purple-200 bg-purple-50 px-4 py-3">
      <p className="text-sm font-medium text-purple-800">👤 Connecting you with a person</p>
      <p className="mt-1 text-xs text-purple-700">{result.message}</p>
    </div>
  );
}
