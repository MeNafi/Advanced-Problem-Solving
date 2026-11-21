import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedMovie {
  title: string;
  releaseYear: number;
  runtime: number;
  watched: boolean;
  prerequisites: string[];
}

// Sample data from the assessment brief (not an official watch guide).
// Runtimes/years are real-world values; Doomsday's runtime is a placeholder.
const movies: SeedMovie[] = [
  { title: 'Iron Man', releaseYear: 2008, runtime: 126, watched: true, prerequisites: [] },
  { title: 'Captain America: The First Avenger', releaseYear: 2011, runtime: 124, watched: true, prerequisites: [] },
  { title: 'The Avengers', releaseYear: 2012, runtime: 143, watched: true, prerequisites: ['Iron Man', 'Captain America: The First Avenger'] },
  { title: 'Captain America: Civil War', releaseYear: 2016, runtime: 147, watched: true, prerequisites: ['The Avengers'] },
  { title: 'Thor: Ragnarok', releaseYear: 2017, runtime: 130, watched: false, prerequisites: [] },
  { title: 'Avengers: Infinity War', releaseYear: 2018, runtime: 149, watched: false, prerequisites: ['Captain America: Civil War', 'Thor: Ragnarok'] },
  { title: 'Avengers: Endgame', releaseYear: 2019, runtime: 181, watched: false, prerequisites: ['Avengers: Infinity War'] },
  { title: 'Avengers: Doomsday', releaseYear: 2026, runtime: 150, watched: false, prerequisites: ['Avengers: Endgame'] },
];

const cinemas = [
  { name: 'Cinema Hall A', bundleSizes: [2, 5] },
  { name: 'Cinema Hall B', bundleSizes: [1, 3, 4] },
  { name: 'Cinema Hall C', bundleSizes: [6, 9, 20] },
  { name: 'Cinema Hall D', bundleSizes: [4, 6] },
];

async function main() {
  // Pass 1: upsert movies (idempotent - safe to run repeatedly)
  for (const m of movies) {
    await prisma.movie.upsert({
      where: { title: m.title },
      update: { releaseYear: m.releaseYear, runtime: m.runtime, watched: m.watched },
      create: { title: m.title, releaseYear: m.releaseYear, runtime: m.runtime, watched: m.watched },
    });
  }

  // Pass 2: (re)build prerequisite links
  const rows = await prisma.movie.findMany({ select: { id: true, title: true } });
  const idByTitle = new Map(rows.map((r) => [r.title, r.id]));
  for (const m of movies) {
    const movieId = idByTitle.get(m.title)!;
    await prisma.moviePrerequisite.deleteMany({ where: { movieId } });
    if (m.prerequisites.length > 0) {
      await prisma.moviePrerequisite.createMany({
        data: m.prerequisites.map((p) => ({ movieId, prerequisiteId: idByTitle.get(p)! })),
      });
    }
  }

  for (const c of cinemas) {
    await prisma.cinema.upsert({
      where: { name: c.name },
      update: { bundleSizes: c.bundleSizes },
      create: c,
    });
  }

  console.log(`Seeded ${movies.length} movies and ${cinemas.length} cinemas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
