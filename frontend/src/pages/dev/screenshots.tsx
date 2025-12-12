import fs from 'fs';
import path from 'path';
import { GetStaticProps } from 'next';
import Image from 'next/image';
import React from 'react';

interface ScreenshotsProps {
  pennylane: string[];
  captures: string[];
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
}

function copyIfNeeded(src: string, dest: string) {
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

export const getStaticProps: GetStaticProps<ScreenshotsProps> = async () => {
  const projectRoot = process.cwd();
  const docsPennylane = path.join(projectRoot, 'docs', 'screenshots', 'pennylane');
  const docsCaptures = path.join(projectRoot, 'docs', 'screenshots', 'captures');
  const publicRoot = path.join(projectRoot, 'frontend', 'public', 'screenshots');
  const publicPennylane = path.join(publicRoot, 'pennylane');
  const publicCaptures = path.join(publicRoot, 'captures');

  // Ensure public dirs
  ensureDir(publicPennylane);
  ensureDir(publicCaptures);

  const pennylaneFiles = fs.existsSync(docsPennylane)
    ? fs.readdirSync(docsPennylane).filter(f => /\.(png|jpe?g|webp)$/i.test(f))
    : [];
  const capturesFiles = fs.existsSync(docsCaptures)
    ? fs.readdirSync(docsCaptures).filter(f => /\.(png|jpe?g|webp)$/i.test(f))
    : [];

  // Copy into public if missing
  for (const f of pennylaneFiles) {
    const src = path.join(docsPennylane, f);
    const dest = path.join(publicPennylane, f);
    copyIfNeeded(src, dest);
  }
  for (const f of capturesFiles) {
    const src = path.join(docsCaptures, f);
    const dest = path.join(publicCaptures, f);
    copyIfNeeded(src, dest);
  }

  return {
    props: {
      pennylane: pennylaneFiles.map(f => `/screenshots/pennylane/${f}`),
      captures: capturesFiles.map(f => `/screenshots/captures/${f}`)
    }
  };
};

export default function ScreenshotsGallery({ pennylane, captures }: ScreenshotsProps) {
  return (
    <div className="p-6 space-y-10">
      <section>
        <h1 className="text-2xl font-semibold mb-4">Pennylane</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pennylane.map((src) => (
            <figure key={src} className="rounded border bg-white p-3 shadow-sm">
              <div className="relative w-full h-64">
                <Image src={src} alt={src} fill className="object-contain" />
              </div>
              <figcaption className="mt-2 text-xs text-gray-600 break-all">{src}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Autres Captures</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {captures.map((src) => (
            <figure key={src} className="rounded border bg-white p-3 shadow-sm">
              <div className="relative w-full h-64">
                <Image src={src} alt={src} fill className="object-contain" />
              </div>
              <figcaption className="mt-2 text-xs text-gray-600 break-all">{src}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
