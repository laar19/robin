export default function LanguageSelector({ value, onChange }) {
  return (
    <div className="language-selector">
      <label>
        Idioma:
        <select value={value} onChange={e => onChange(e.target.value)}>
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="pt">Português</option>
          <option value="fr">Français</option>
          <option value="de">Deutsch</option>
        </select>
      </label>
    </div>
  )
}
