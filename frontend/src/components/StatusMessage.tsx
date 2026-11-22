export function LoadingMessage({ children = 'Loading…' }: { children?: string }) {
  return <p role="status">{children}</p>;
}

export function EmptyMessage({ children }: { children: string }) {
  return <p role="status">{children}</p>;
}

export function ErrorMessage({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <p role="alert" className="error-text">
      {message}{' '}
      <button type="button" className="status-retry" onClick={onRetry}>
        Try again
      </button>
    </p>
  );
}
