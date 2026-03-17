export default function Loading() {
  return (
    <main className="min-h-screen px-4 py-8 md:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-panel p-6 md:p-8">
          <div className="skeleton h-7 w-56 rounded-md" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <article key={index} className="glass-tile p-3">
                <div className="skeleton aspect-[2/3] rounded-xl" />
                <div className="skeleton mt-3 h-4 rounded-md" />
                <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
                <div className="skeleton mt-3 h-9 rounded-full" />
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
