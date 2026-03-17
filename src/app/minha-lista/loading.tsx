import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default function Loading() {
  return (
    <main className="min-h-screen px-3 py-6 pb-28 sm:px-4 md:px-10 md:py-8 md:pb-8">
      <div className="mx-auto w-full max-w-7xl">
        <section className="glass-shell mb-5 p-5 md:mb-6 md:p-8">
          <div className="skeleton h-8 w-48 rounded-md" />
          <div className="skeleton mt-3 h-4 w-80 max-w-full rounded-md" />
          <div className="skeleton mt-2 h-3 w-40 rounded-md" />
        </section>

        <section className="glass-panel p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="skeleton h-11 rounded-xl" />
            <div className="skeleton h-11 rounded-xl" />
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <article key={index} className="glass-tile p-3">
                <div className="skeleton h-14 rounded-xl" />
                <div className="skeleton mt-3 h-4 rounded-md" />
                <div className="skeleton mt-2 h-3 w-3/4 rounded-md" />
              </article>
            ))}
          </div>
        </section>

        <MobileBottomNav active="my-list" />
      </div>
    </main>
  );
}
