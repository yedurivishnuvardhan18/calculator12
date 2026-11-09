import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

const SITE_URL = "https://calculator.teamdino.in";
const TEAMDINO_URL = "https://www.teamdino.in";
const personData = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/about#yeduri-vishnuvardhan`,
  name: "Yeduri Vishnuvardhan",
  jobTitle: "Administrator",
  worksFor: {
    "@type": "Organization",
    name: "TeamDino",
    url: TEAMDINO_URL,
    sameAs: [TEAMDINO_URL],
  },
  description: "Administrator of TeamDino and the GITAM Grade Calculator.",
  url: `${SITE_URL}/about`,
};

export default function About() {
  return (
    <main className="container max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <Seo
        title="About TeamDino & Its Admin | Yeduri Vishnuvardhan"
        description="Learn about TeamDino and its GITAM Grade Calculator. Yeduri Vishnuvardhan is the administrator of TeamDino and this calculator."
        keywords={["Yeduri Vishnuvardhan", "TeamDino admin", "TeamDino administrator", "GITAM Grade Calculator admin"]}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(personData)}</script>
      </Helmet>
      <article className="space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-black font-display sm:text-4xl">About TeamDino</h1>
          <p className="text-lg text-muted-foreground">
            TeamDino provides tools for GITAM students, including the GITAM Grade Calculator.
          </p>
        </header>
        <section className="space-y-3" aria-labelledby="admin-heading">
          <h2 id="admin-heading" className="text-2xl font-bold font-display">
            TeamDino administrator
          </h2>
          <p className="leading-7">
            <strong>Yeduri Vishnuvardhan</strong> is the administrator of TeamDino and the
            GITAM Grade Calculator. The calculator helps students work with semester
            grades, SGPA, and CGPA.
          </p>
        </section>
        <section className="space-y-3" aria-labelledby="links-heading">
          <h2 id="links-heading" className="text-2xl font-bold font-display">
            Find TeamDino
          </h2>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <a
                href={TEAMDINO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary underline underline-offset-4"
              >
                TeamDino website
              </a>
            </li>
          </ul>
        </section>
        <p>
          <Link to="/" className="font-semibold text-primary underline underline-offset-4">
            Visit the GITAM CGPA, SGPA, and grade calculator
          </Link>
        </p>
      </article>
    </main>
  );
}
