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
      <body>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-6xl font-bold mb-4">Hata</h1>
            <h2 className="text-2xl font-semibold mb-2">Bir şeyler ters gitti</h2>
            <p className="text-muted-foreground mb-6">
              {error.message || "Beklenmeyen bir hata oluştu"}
            </p>
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
