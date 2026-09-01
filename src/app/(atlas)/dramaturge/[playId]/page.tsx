import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/Container";
import { PlayView } from "@/components/dramaturge/PlayView";
import { findPlay, plays } from "@/data/dramaturge";
import "@/components/dramaturge/dramaturge.css";

export function generateStaticParams() {
  return plays.map(({ play }) => ({ playId: play.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ playId: string }>;
}): Promise<Metadata> {
  const { playId } = await params;
  const found = findPlay(playId);
  if (!found) return { title: "Not found. Futures Atlas" };
  return {
    title: `${found.play.spine.title}. Dramaturge`,
    description: found.play.spine.logline,
  };
}

export default async function PlayPage({ params }: { params: Promise<{ playId: string }> }) {
  const { playId } = await params;
  const found = findPlay(playId);
  if (!found) notFound();

  return (
    <div className="dg">
      <Container>
        <div className="dg-play" style={{ paddingBottom: 0 }}>
          <Link href="/dramaturge" className="dg-ap">
            ← the three plays
          </Link>
        </div>
        <PlayView play={found.play} bundle={found.bundle} />
      </Container>
    </div>
  );
}
