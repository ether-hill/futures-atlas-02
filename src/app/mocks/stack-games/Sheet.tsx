"use client";

import { useEffect, useState } from "react";
import { GAMES } from "./stack";

/**
 * One game per screen. They used to sit four across at 70%, which was useful
 * for telling them apart and useless for judging any of them: at that size a
 * brick is a coloured square and the names are gone, which is exactly what a
 * reel is being judged on.
 *
 * The stage is authored at 430x764 and can only be SCALED, so the fit is
 * measured here rather than expressed in CSS — `scale()` takes a number and
 * there is no way to derive one from `vh`. Each frame is sized to the scaled
 * stage so the block's layout still adds up.
 *
 * The iframes are lazy, which on a page of full-height blocks means a game
 * does not start until it is nearly in view: four boards animating at once,
 * three of them off screen, is four times the work for one thing to look at.
 */
export function Sheet() {
  const [scale, setScale] = useState(0.86);

  useEffect(() => {
    const fit = () => {
      const room = Math.min(window.innerHeight - 132, window.innerWidth - 480);
      setScale(Math.max(0.42, Math.min(1, room / 764)));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  return (
    <div className="sg-sheet">
      <header className="sg-intro">
        <h1>The stack, as four games</h1>
        <p>
          Four ways of reading the same inventory. Every brick is a tool the studio actually builds
          with; the coloured edge is the family it belongs to, and every game cancels bricks out on
          that family rather than on the tool itself. All four are 9:16, authored at 430&#215;764,
          and loop without an ending. Scroll for one at a time.
        </p>
      </header>

      {GAMES.map((g, i) => (
        <section className="sg-block" key={g.id} id={g.id}>
          <div
            className="sg-frame"
            style={{ width: Math.round(430 * scale), height: Math.round(764 * scale) }}
          >
            <iframe
              src={`/mocks/stack-games/${g.id}`}
              title={g.title}
              loading="lazy"
              style={{ transform: `scale(${scale})` }}
            />
          </div>
          <div className="sg-say">
            <span className="sg-n">{String(i + 1).padStart(2, "0")}</span>
            <h2>{g.title}</h2>
            <p>{g.blurb}</p>
            <a href={`/mocks/stack-games/${g.id}`}>Full bleed &#8594;</a>
          </div>
        </section>
      ))}
    </div>
  );
}
