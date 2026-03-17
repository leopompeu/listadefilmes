export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <section className="glass-panel p-6 md:p-8">
          <div className="skeleton h-8 w-52 rounded-md" />
          <div className="skeleton mt-3 h-4 w-72 rounded-md" />
          <div className="mt-6 grid gap-6 md:grid-cols-[260px_1fr]">
            <div className="skeleton aspect-[2/3] rounded-2xl" />
            <div className="space-y-3">
              <div className="skeleton h-4 rounded-md" />
              <div className="skeleton h-4 w-11/12 rounded-md" />
              <div className="skeleton h-4 w-9/12 rounded-md" />
              <div className="skeleton mt-8 h-36 rounded-xl" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
