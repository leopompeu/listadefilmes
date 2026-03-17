import Image from "next/image";

export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="glass-panel w-full max-w-md p-8 text-center">
        <div className="brand-header justify-center">
          <Image
            src="/logo.svg"
            alt="Logo Caralho Flix"
            className="brand-logo"
            width={42}
            height={42}
          />
          <p className="brand-mark text-3xl">CARALHO FLIX DB</p>
        </div>
        <p className="mt-4 text-sm text-slate-200">Carregando catalogo...</p>
        <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="shimmer-track h-full w-1/2 rounded-full" />
        </div>
      </section>
    </main>
  );
}
