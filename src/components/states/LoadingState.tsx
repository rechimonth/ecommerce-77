// Presentacional: no conoce productos, ni servicios, ni Firestore.
type LoadingStateProps = {
  message?: string;
  skeletons?: number;
};

export function LoadingState({
  message = "Cargando…",
  skeletons = 8,
}: LoadingStateProps) {
  return (
    <div role="status" aria-live="polite">
      <p className="mb-4 text-sm text-neutral-500">{message}</p>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: skeletons }, (_, index) => (
          <div key={index} className="animate-pulse">
            <div className="aspect-[3/4] rounded-sm bg-neutral-200" />
            <div className="mt-3 h-3 w-2/3 rounded-sm bg-neutral-200" />
            <div className="mt-2 h-3 w-1/3 rounded-sm bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
