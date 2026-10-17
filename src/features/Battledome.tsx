import notes from "../data/battledome.json";
import { Panel, Link } from "../components/shared";

/** Preserve the training plan's order and separate each stage for new players. */
export function Battledome() {
  return (
    <Panel collapsible title="Battledome training">
      <div className="training-guide panel-note">
        <p>{notes.intro}</p>
        {notes.sections.map((section) => (
          <section key={section.title}>
            <h3>{section.title}</h3>
            <ul>
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            {!!section.links.length && (
              <div className="actions">
                {section.links.map((link) => (
                  <Link key={link.url} href={link.url}>
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
            {section.note && <p className="muted">{section.note}</p>}
          </section>
        ))}
        <section>
          <h3>Items worth buying later</h3>
          <ul>
            {notes.items.map((item) => (
              <li key={item.label}>
                <Link href={item.url}>{item.label}</Link>
                {item.text.slice(item.label.length)}
              </li>
            ))}
          </ul>
        </section>
        <p className="muted text-small">
          {notes.priceNote}{" "}
          <Link href={notes.guide.url}>{notes.guide.label}</Link>
        </p>
      </div>
    </Panel>
  );
}
