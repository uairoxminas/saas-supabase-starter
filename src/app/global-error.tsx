"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          gap: "1rem",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600 }}>
          Something went wrong
        </h1>
        <p style={{ color: "#6b7280", maxWidth: "400px" }}>
          An unexpected error occurred. Please try again.
          {error.digest && (
            <span style={{ display: "block", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              Error ID: {error.digest}
            </span>
          )}
        </p>
        <button
          onClick={reset}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #e5e7eb",
            cursor: "pointer",
            background: "transparent",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
