import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import type { Comedian, Show } from "../types";
import { citySuggestions, type CitySuggestion } from "../lib/geo";

type Props = {
  /** Shows the suggestions are built from; each suggestion has nights here. */
  shows: Show[];
  comedians: Comedian[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Keep the label for screen readers only (the dates toolbar). */
  hideLabel?: boolean;
  placeholder?: string;
  type?: "text" | "search";
  className?: string;
};

/**
 * A city box with suggestions drawn from the tracker's own places, matched the
 * same way the map pins shows (`citySuggestions` in `src/lib/geo.ts`). It
 * follows the ARIA combobox pattern: arrows move, Enter picks, Escape closes,
 * and a tap picks without the box losing focus first.
 */
export function CityCombobox({
  shows,
  comedians,
  value,
  onChange,
  label,
  hideLabel,
  placeholder,
  type = "text",
  className = "field",
}: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  const suggestions = useMemo(() => citySuggestions(shows, value), [shows, value]);
  const colorOf = useMemo(
    () => Object.fromEntries(comedians.map((c) => [c.id, c.color])),
    [comedians],
  );
  const nameOf = useMemo(
    () => Object.fromEntries(comedians.map((c) => [c.id, c.name])),
    [comedians],
  );

  // Picking the place already in the box would do nothing, so it isn't offered.
  const exactOnly =
    suggestions.length === 1 &&
    suggestions[0].label.toLowerCase() === value.trim().toLowerCase();
  const expanded = open && suggestions.length > 0 && !exactOnly;

  useEffect(() => {
    if (active < 0 || !listRef.current) return;
    const option = listRef.current.querySelector<HTMLElement>(`[data-index="${active}"]`);
    option?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function pick(suggestion: CitySuggestion, viaPointer: boolean) {
    onChange(suggestion.label);
    setOpen(false);
    setActive(-1);
    // A tap is done with the box: drop the phone keyboard so the results show.
    if (viaPointer) inputRef.current?.blur();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const count = suggestions.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActive(count ? 0 : -1);
        } else {
          setActive((i) => (i + 1) % count);
        }
        break;
      case "ArrowUp":
        event.preventDefault();
        if (!expanded) {
          setOpen(true);
          setActive(count ? count - 1 : -1);
        } else {
          setActive((i) => (i <= 0 ? count - 1 : i - 1));
        }
        break;
      case "Enter":
        if (expanded && active >= 0 && suggestions[active]) {
          event.preventDefault();
          pick(suggestions[active], false);
        }
        break;
      case "Escape":
        if (expanded) {
          // Close the list first; a second Escape clears a search box as usual.
          event.preventDefault();
          setOpen(false);
          setActive(-1);
        }
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  const typed = value.trim().toLowerCase();

  return (
    <div className={`${className} combo`}>
      <label htmlFor={id} className={hideLabel ? "visually-hidden" : undefined}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        type={type}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-activedescendant={expanded && active >= 0 ? `${id}-opt-${active}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          // Typing highlights the best match so Enter takes it; an empty box
          // just lists the busiest places with nothing chosen.
          setActive(e.target.value.trim() ? 0 : -1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onBlur={() => {
          setOpen(false);
          setActive(-1);
        }}
        onKeyDown={onKeyDown}
      />
      <AnimatePresence>
        {expanded ? (
          <m.ul
            key="list"
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={`${label} suggestions`}
            className="combo-list"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4, transition: { duration: 0.1 } }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          >
            {suggestions.map((s, index) => {
              const head =
                typed && s.label.toLowerCase().startsWith(typed) ? s.label.slice(0, typed.length) : "";
              return (
                <li
                  key={s.label}
                  id={`${id}-opt-${index}`}
                  data-index={index}
                  role="option"
                  aria-selected={index === active}
                  className="combo-option"
                  // Keep focus in the box so blur doesn't close the list mid-tap.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseMove={() => index !== active && setActive(index)}
                  onClick={() => pick(s, true)}
                >
                  <span className="combo-place">
                    {head ? (
                      <>
                        <strong>{head}</strong>
                        {s.label.slice(head.length)}
                      </>
                    ) : (
                      s.label
                    )}
                    {s.detail ? <span className="combo-detail">{s.detail}</span> : null}
                  </span>
                  <span
                    className="combo-dots"
                    aria-hidden="true"
                    title={s.comedianIds.map((cid) => nameOf[cid] ?? cid).join(", ")}
                  >
                    {s.comedianIds.slice(0, 5).map((cid) => (
                      <i key={cid} style={{ background: colorOf[cid] ?? "currentColor" }} />
                    ))}
                  </span>
                  <span className="combo-count">
                    {s.nights} {s.nights === 1 ? "night" : "nights"}
                  </span>
                </li>
              );
            })}
          </m.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
