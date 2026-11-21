/**
 * End-to-end API check. Run against a live, seeded backend:
 *   npm run test:api            (API_URL defaults to http://localhost:5000/api)
 * It creates its own temporary records (unique names) and verifies every
 * assessment example plus the main validation rules.
 */
const API = process.env.API_URL ?? "http://localhost:5000/api";
let failures = 0;

async function call(method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: (await res.json()) as any };
}

function check(name: string, ok: boolean, extra?: unknown) {
  if (!ok) failures++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${ok ? "" : `  -> ${JSON.stringify(extra)}`}`);
}

async function main() {
  const movies = (await call("GET", "/movies")).body as any[];
  const id = (title: string) => movies.find((m) => m.title === title)?.id as string;
  check("seed data present (8 movies)", movies.length >= 8, movies.length);

  const doom = (await call("GET", `/movies/${id("Avengers: Doomsday")}/rewatch-order`)).body;
  check("Doomsday -> 7 prerequisites in valid order",
    doom.rewatchOrder.map((m: any) => m.title).join("|") ===
      ["Iron Man", "Captain America: The First Avenger", "The Avengers", "Captain America: Civil War", "Thor: Ragnarok", "Avengers: Infinity War", "Avengers: Endgame"].join("|"),
    doom.rewatchOrder.map((m: any) => m.title));
  check("Doomsday excludes target", !doom.rewatchOrder.some((m: any) => m.title === "Avengers: Doomsday"));
  check("Doomsday summary counts consistent", doom.summary.totalMovies === 7 && doom.summary.watchedMovies + doom.summary.unwatchedMovies === 7, doom.summary);

  const civil = (await call("GET", `/movies/${id("Captain America: Civil War")}/rewatch-order`)).body;
  const civilTitles = civil.rewatchOrder.map((m: any) => m.title);
  check("Civil War -> Iron Man + First Avenger, then The Avengers",
    civilTitles.length === 3 && civilTitles[2] === "The Avengers" && civilTitles.slice(0, 2).includes("Iron Man") && civilTitles.slice(0, 2).includes("Captain America: The First Avenger"), civilTitles);

  const thor = (await call("GET", `/movies/${id("Thor: Ragnarok")}/rewatch-order`)).body;
  check("Ragnarok -> empty list", thor.rewatchOrder.length === 0 && thor.summary.totalMovies === 0);

  const cycle = await call("PATCH", `/movies/${id("Iron Man")}`, { prerequisites: [id("Avengers: Endgame")] });
  check("Endgame as Iron Man prerequisite -> 409 CIRCULAR_DEPENDENCY", cycle.status === 409 && cycle.body.code === "CIRCULAR_DEPENDENCY", cycle);
  const selfDep = await call("PATCH", `/movies/${id("Iron Man")}`, { prerequisites: [id("Iron Man")] });
  check("Self prerequisite -> 409", selfDep.status === 409 && selfDep.body.code === "CIRCULAR_DEPENDENCY", selfDep);

  const dup = await call("POST", "/movies", { title: "Iron Man", releaseYear: 2008, runtime: 126 });
  check("Duplicate title -> 409", dup.status === 409, dup);
  const bad = await call("POST", "/movies", { title: "", releaseYear: "x", runtime: 999 });
  check("Invalid movie -> 400", bad.status === 400 && bad.body.code === "VALIDATION_ERROR", bad);

  const stamp = Date.now();
  const created = await call("POST", "/movies", { title: `Smoke Test ${stamp}`, releaseYear: 2030, runtime: 100, prerequisites: [id("Avengers: Doomsday")] });
  check("Create movie with prerequisite -> 201", created.status === 201 && created.body.prerequisites.length === 1, created);
  const toggled = await call("PATCH", `/movies/${created.body.id}`, { watched: true, runtime: 101 });
  check("Update watched + runtime", toggled.status === 200 && toggled.body.watched === true && toggled.body.runtime === 101, toggled);
  const cleared = await call("PATCH", `/movies/${created.body.id}`, { prerequisites: [] });
  check("Remove prerequisites", cleared.status === 200 && cleared.body.prerequisites.length === 0, cleared);

  const cinemas = (await call("GET", "/cinemas")).body as any[];
  const examples: [number[], number, number | null][] = [[[1, 3, 4], 6, 2], [[2, 5], 11, 4], [[6, 9, 20], 44, 4], [[4, 6], 7, null]];
  for (const [sizes, group, expected] of examples) {
    const cinema = cinemas.find((c) => c.bundleSizes.slice().sort((a: number, b: number) => a - b).join() === sizes.join());
    if (!cinema) { check(`cinema for [${sizes}] exists`, false); continue; }
    const q = (await call("GET", `/cinemas/${cinema.id}/booking?groupSize=${group}`)).body;
    const ok = expected === null ? q.possible === false : q.possible && q.totalBundles === expected && q.totalSeats === group;
    check(`Booking [${sizes}] x ${group} -> ${expected ?? "not possible"}`, ok, q);
  }

  const newCinema = await call("POST", "/cinemas", { name: `Smoke Cinema ${stamp}`, bundleSizes: [7, 3] });
  check("Create cinema -> 201", newCinema.status === 201, newCinema);
  const dupCinema = await call("POST", "/cinemas", { name: `Smoke Cinema ${stamp}`, bundleSizes: [1] });
  check("Duplicate cinema -> 409", dupCinema.status === 409, dupCinema);
  const badCinema = await call("POST", "/cinemas", { name: "x", bundleSizes: [2, 2, 501] });
  check("Invalid bundle sizes -> 400", badCinema.status === 400, badCinema);
  const badGroup = await call("GET", `/cinemas/${newCinema.body.id}/booking?groupSize=10001`);
  check("Group size 10001 -> 400", badGroup.status === 400, badGroup);

  console.log(failures === 0 ? "\nAll API checks passed." : `\n${failures} check(s) failed.`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });
