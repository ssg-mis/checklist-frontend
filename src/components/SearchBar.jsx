import { Search } from "lucide-react";

/**
 * Shared search bar — the single, consistent search input used across the app.
 *
 * Props:
 *  - value, onChange: standard controlled-input props (onChange receives the event)
 *  - placeholder: defaults to "Search..."
 *  - className: applied to the wrapper, use it for width/flex (e.g. "flex-1 min-w-[200px]")
 *  - any other props (disabled, id, etc.) are forwarded to the <input>
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  ...inputProps
}) {
  return (
    <div
      className={`flex w-full max-w-xs items-center gap-2 rounded-md border border-gray-300 bg-white px-3 focus-within:border-transparent focus-within:ring-2 focus-within:ring-purple-500 ${className}`}
    >
      <Search className="shrink-0 text-gray-400" size={16} aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full min-w-0 bg-transparent py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
        {...inputProps}
      />
    </div>
  );
}
