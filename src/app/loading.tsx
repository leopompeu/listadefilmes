import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <section className="glass-shell p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="skeleton h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-24 rounded-md" />
                <div className="skeleton h-4 w-28 rounded-md" />
              </div>
            </div>
            <div className="skeleton h-10 w-16 rounded-xl" />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="glass-panel p-5">
            <div className="skeleton h-11 w-full rounded-xl" />
            <div className="mt-3 skeleton h-10 w-32 rounded-xl" />
            <div className="mt-4 flex items-center justify-between">
              <div className="skeleton h-4 w-40 rounded-md" />
              <div className="flex items-center gap-2">
                <div className="skeleton h-8 w-8 rounded-full" />
                <div className="skeleton h-4 w-16 rounded-md" />
                <div className="skeleton h-8 w-8 rounded-full" />
              </div>
            </div>
            <div className="movie-grid mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="movie-card glass-tile p-3">
                  <div className="skeleton aspect-[2/3] rounded-xl" />
                  <div className="skeleton mt-3 h-4 rounded-md" />
                  <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
                  <div className="skeleton mt-3 h-9 rounded-full" />
                </article>
              ))}
            </div>
          </div>

          <div className="hidden glass-panel p-5 lg:block">
            <div className="skeleton h-6 w-36 rounded-md" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="skeleton h-11 rounded-xl" />
              <div className="skeleton h-11 rounded-xl" />
            </div>
            <div className="mt-4 space-y-3">
              <div className="skeleton h-4 rounded-md" />
              <div className="skeleton h-4 w-11/12 rounded-md" />
              <div className="skeleton h-4 w-9/12 rounded-md" />
            </div>
          </div>
        </section>
        <MobileBottomNav active="home" />
      </div>
    </main>
  );
}
