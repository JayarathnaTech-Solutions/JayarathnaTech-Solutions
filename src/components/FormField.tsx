import { inputClass } from '../lib/ui'

export function Field({
    label,
    name,
    type = 'text',
    placeholder,
    required,
    defaultValue,
}: {
    label: string
    name: string
    type?: string
    placeholder?: string
    required?: boolean
    defaultValue?: string
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                required={required}
                defaultValue={defaultValue}
                className={inputClass}
            />
        </div>
    )
}

export function TextAreaField({
    label,
    name,
    placeholder,
    required,
    rows = 4,
    defaultValue,
}: {
    label: string
    name: string
    placeholder?: string
    required?: boolean
    rows?: number
    defaultValue?: string
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <textarea
                id={name}
                name={name}
                rows={rows}
                placeholder={placeholder}
                required={required}
                defaultValue={defaultValue}
                className={inputClass}
            />
        </div>
    )
}

export function SelectField({
    label,
    name,
    required,
    defaultValue,
    options,
}: {
    label: string
    name: string
    required?: boolean
    defaultValue?: string
    options: { value: string; label: string }[]
}) {
    return (
        <div>
            <label htmlFor={name} className="mb-1.5 block text-sm font-medium text-slate-300">
                {label}
            </label>
            <select id={name} name={name} required={required} defaultValue={defaultValue} className={inputClass}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    )
}
