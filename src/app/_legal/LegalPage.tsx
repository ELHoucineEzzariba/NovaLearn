import Link from "next/link";

const owner = {
  name: "Elhoucine Ezzariba",
  street: "Grantham-Allee 23",
  city: "53757 Sankt Augustin",
  country: "Deutschland",
  email: "el.ezzariba@gmail.com",
};

const shellStyle = {
  minHeight: "100vh",
  background: "#09090b",
  color: "#f4f4f5",
  padding: "clamp(2rem, 6vw, 5rem) 1.25rem",
} as const;

const articleStyle = {
  width: "min(100%, 760px)",
  margin: "0 auto",
  fontFamily: "Arial, Helvetica, sans-serif",
  fontSize: "1rem",
  lineHeight: 1.75,
} as const;

const linkStyle = {
  color: "#67e8f9",
  textDecoration: "underline",
  textUnderlineOffset: "0.2em",
} as const;

function Address() {
  return (
    <address style={{ fontStyle: "normal" }}>
      {owner.name}<br />
      {owner.street}<br />
      {owner.city}<br />
      {owner.country}
    </address>
  );
}

function LegalShell({ title, projectName, children }: { title: string; projectName: string; children: React.ReactNode }) {
  return (
    <main id="main-content" style={shellStyle}>
      <article style={articleStyle}>
        <Link href="/" style={linkStyle}>← Zurück zu {projectName}</Link>
        <p style={{ marginTop: "2.5rem", color: "#a1a1aa", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: "0.78rem" }}>
          Privates Lern- und Portfolio-Projekt
        </p>
        <h1 style={{ margin: "0.35rem 0 2rem", fontSize: "clamp(2.25rem, 7vw, 4.5rem)", lineHeight: 1.05, letterSpacing: "-0.04em" }}>{title}</h1>
        <div style={{ display: "grid", gap: "1.75rem" }}>{children}</div>
        <p style={{ marginTop: "3rem", color: "#a1a1aa", fontSize: "0.9rem" }}>Stand: 3. August 2026</p>
      </article>
    </main>
  );
}

export function LegalFooter() {
  return (
    <footer style={{ borderTop: "1px solid rgba(161,161,170,.25)", background: "#09090b", color: "#d4d4d8", padding: "1.25rem" }}>
      <nav aria-label="Rechtliche Informationen" style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.5rem 1.5rem", font: "500 0.875rem/1.5 Arial, Helvetica, sans-serif" }}>
        <Link href="/impressum" style={linkStyle}>Impressum</Link>
        <Link href="/datenschutz" style={linkStyle}>Datenschutz</Link>
        <a href={`mailto:${owner.email}`} style={linkStyle}>Kontakt</a>
      </nav>
    </footer>
  );
}

export function ImprintPage({ projectName }: { projectName: string }) {
  return (
    <LegalShell title="Impressum" projectName={projectName}>
      <section><h2>Anbieter</h2><Address /></section>
      <section><h2>Kontakt</h2><p>E-Mail: <a href={`mailto:${owner.email}`} style={linkStyle}>{owner.email}</a></p></section>
      <section><h2>Hinweis zum Projekt</h2><p>{projectName} ist ein privates, nicht kommerzielles Lern- und Portfolio-Projekt. Es werden über diese Website keine Waren oder Dienstleistungen verkauft und keine kostenpflichtigen Verträge angeboten.</p></section>
      <section><h2>Haftung für Inhalte</h2><p>Die Inhalte wurden mit Sorgfalt erstellt. Eine Gewähr für Richtigkeit, Vollständigkeit und Aktualität kann dennoch nicht übernommen werden.</p></section>
      <section><h2>Externe Links</h2><p>Für Inhalte verlinkter externer Websites sind ausschließlich deren Betreiber verantwortlich. Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.</p></section>
      <section><h2>Urheberrecht</h2><p>Eigene Inhalte und Werke unterliegen dem deutschen Urheberrecht. Inhalte Dritter werden als solche gekennzeichnet. Eine Nutzung außerhalb der gesetzlichen Grenzen bedarf der vorherigen Zustimmung der jeweiligen Rechteinhaber.</p></section>
    </LegalShell>
  );
}

export function PrivacyPage({ projectName, services = [] }: { projectName: string; services?: string[] }) {
  return (
    <LegalShell title="Datenschutz" projectName={projectName}>
      <section><h2>1. Verantwortlicher</h2><Address /><p>E-Mail: <a href={`mailto:${owner.email}`} style={linkStyle}>{owner.email}</a></p></section>
      <section><h2>2. Grundsatz</h2><p>{projectName} ist ein privates, nicht kommerzielles Lernprojekt. Personenbezogene Daten werden nur verarbeitet, soweit dies für den technischen Betrieb oder eine von dir aktiv verwendete Demo-Funktion erforderlich ist.</p></section>
      <section><h2>3. Hosting und Server-Logs</h2><p>Beim Aufruf können der Hosting-Anbieter und vorgeschaltete Infrastruktur technisch notwendige Daten verarbeiten, insbesondere IP-Adresse, Zeitpunkt, aufgerufene URL, Referrer, Browser und Betriebssystem. Die Verarbeitung dient Sicherheit, Stabilität und Fehleranalyse auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.</p></section>
      <section><h2>4. Demo-Funktionen und lokale Speicherung</h2><p>Eingaben in reine Oberflächen-Demos werden grundsätzlich nicht für Werbung oder Profilbildung genutzt. Einstellungen und Beispieldaten können lokal im Browser gespeichert werden. Bitte verwende in Demo-Feldern keine echten vertraulichen oder sensiblen Daten.</p></section>
      {services.length > 0 && <section><h2>5. Eingesetzte Dienste</h2><p>Abhängig von der aktiv genutzten Funktion kann eine Übermittlung an folgende technische Dienstleister stattfinden: {services.join(", ")}. Die Verarbeitung erfolgt nur zur Bereitstellung der jeweiligen Funktion. Bei einer Übermittlung in Drittländer werden die anwendbaren gesetzlichen Garantien des jeweiligen Anbieters zugrunde gelegt.</p></section>}
      <section><h2>{services.length > 0 ? "6" : "5"}. Kontaktaufnahme</h2><p>Wenn du per E-Mail Kontakt aufnimmst, werden deine Angaben zur Bearbeitung der Anfrage verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b oder lit. f DSGVO. Die Daten werden gelöscht, sobald sie nicht mehr erforderlich sind und keine gesetzlichen Pflichten entgegenstehen.</p></section>
      <section><h2>{services.length > 0 ? "7" : "6"}. Speicherdauer</h2><p>Daten werden nur so lange gespeichert, wie der jeweilige Zweck besteht oder gesetzliche Aufbewahrungspflichten gelten. Lokale Browserdaten kannst du über die Einstellungen deines Browsers löschen.</p></section>
      <section><h2>{services.length > 0 ? "8" : "7"}. Deine Rechte</h2><p>Du hast im Rahmen der gesetzlichen Voraussetzungen Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie das Recht, eine Einwilligung mit Wirkung für die Zukunft zu widerrufen.</p></section>
      <section><h2>{services.length > 0 ? "9" : "8"}. Beschwerderecht</h2><p>Du kannst dich bei einer Datenschutzaufsichtsbehörde beschweren. Zuständig ist insbesondere die Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen.</p></section>
      <section><h2>{services.length > 0 ? "10" : "9"}. Keine automatisierte Entscheidung</h2><p>Es findet keine rechtlich wirksame automatisierte Entscheidungsfindung und kein Tracking zu Werbezwecken statt.</p></section>
    </LegalShell>
  );
}
