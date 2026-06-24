import Experience from "./Experience";

// Static shell — fixed texture overlays + the client experience.
export default function Page() {
  return (
    <>
      <div className="fx vig" aria-hidden="true" />
      <div className="fx scan" aria-hidden="true" />
      <div className="fx grain" aria-hidden="true" />
      <Experience />
    </>
  );
}
