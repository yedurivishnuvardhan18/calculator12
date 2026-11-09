import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const SITE_URL = "https://calculator.teamdino.in";
const LOGO_URL = `${SITE_URL}/logo.png`;
const DEFAULT_KEYWORDS = [
  "GITAM CGPA calculator",
  "GITAM SGPA calculator",
  "GITAM grade calculator",
  "GITAM GPA calculator",
  "CGPA calculator GITAM",
  "SGPA calculator GITAM",
  "grade calculator GITAM",
  "TeamDino grade calculator",
  "GITAM semester grade calculator",
  "GITAM student grade calculator",
];

interface SeoProps {
  title: string;
  description: string;
  keywords?: string[];
  noIndex?: boolean;
  isHomePage?: boolean;
}

export function Seo({ title, description, keywords = DEFAULT_KEYWORDS, noIndex = false, isHomePage = false }: SeoProps) {
  const { pathname } = useLocation();
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const canonicalUrl = `${SITE_URL}${normalizedPath === "/" ? "/" : normalizedPath}`;
  const metaKeywords = keywords.join(", ");

  useEffect(() => {
    document.querySelectorAll("[data-default-seo]").forEach((element) => element.remove());
  }, []);

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "GITAM Grade Calculator | TeamDino",
    url: SITE_URL,
    description,
    image: LOGO_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const webpageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: canonicalUrl,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  };
  const applicationData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "GITAM Grade Calculator",
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: `${SITE_URL}/`,
    description,
    author: {
      "@type": "Organization",
      name: "TeamDino",
    },
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={metaKeywords} />
      <meta name="robots" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <meta name="googlebot" content={noIndex ? "noindex, nofollow" : "index, follow"} />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={LOGO_URL} />
      <meta property="og:site_name" content="GITAM Grade Calculator | TeamDino" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={LOGO_URL} />
      <script type="application/ld+json">{JSON.stringify(websiteData)}</script>
      <script type="application/ld+json">{JSON.stringify(webpageData)}</script>
      {isHomePage && <script type="application/ld+json">{JSON.stringify(applicationData)}</script>}
    </Helmet>
  );
}
