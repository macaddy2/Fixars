/**
 * Page heading following the prototype's page-head grammar:
 * eyebrow row (app-colored glyph + uppercase tag), Space Grotesk title,
 * muted sub line, with actions aligned right.
 */
export default function PageHead({ app = 'fixars', glyph, tag, title, sub, actions }) {
    return (
        <div className="page-head">
            <div>
                <div className="page-eyebrow">
                    {glyph && <div className={`page-icon ${app}`}>{glyph}</div>}
                    {tag && <span className="page-tag">{tag}</span>}
                </div>
                <h1 className="page-title">{title}</h1>
                {sub && <p className="page-sub">{sub}</p>}
            </div>
            {actions}
        </div>
    )
}
