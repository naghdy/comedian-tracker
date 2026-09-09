import { useState, type FormEvent } from "react";
import type { Comedian, Show } from "../types";
import { knownCities } from "../lib/geo";

type Props = {
  comedians: Comedian[];
  onClose: () => void;
  onSave: (show: Omit<Show, "id">) => void;
};

export function ShowForm({ comedians, onClose, onSave }: Props) {
  const [city, setCity] = useState("");
  const cities = knownCities();
  const known = cities.some(
    (c) => c.toLowerCase() === city.trim().toLowerCase(),
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const comedianId = String(data.get("comedianId") ?? "");
    const title = String(data.get("title") ?? "").trim();
    const venue = String(data.get("venue") ?? "").trim();
    const cityValue = String(data.get("city") ?? "").trim();
    const date = String(data.get("date") ?? "");
    if (!comedianId || !title || !venue || !cityValue || !date) return;
    onSave({
      comedianId,
      title,
      venue,
      city: cityValue,
      region: String(data.get("region") ?? "").trim() || undefined,
      country: String(data.get("country") ?? "").trim() || undefined,
      date,
      time: String(data.get("time") ?? "").trim() || undefined,
      ticketUrl: String(data.get("ticketUrl") ?? "").trim() || undefined,
      source: "user",
    });
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Add show">
      <form className="modal-card" onSubmit={submit}>
        <h2 style={{ marginTop: 0 }}>Add show</h2>
        <p className="lede">Saved in this browser via localStorage. No account required.</p>
        <label className="field">
          <span>Comedian</span>
          <select name="comedianId" required defaultValue={comedians[0]?.id}>
            {comedians.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Title</span>
          <input name="title" placeholder="Show title" required />
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Venue</span>
            <input name="venue" placeholder="Venue" required />
          </label>
          <label className="field">
            <span>City</span>
            <input
              name="city"
              list="city-options"
              placeholder="Seattle"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            <datalist id="city-options">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
        </div>
        {city && !known ? (
          <p className="lede">
            “{city}” is not in the static lat/lng table, so it will appear in
            the agenda but not on the map until you add coordinates in{" "}
            <code>data/cities.json</code>.
          </p>
        ) : null}
        <div className="grid-2">
          <label className="field">
            <span>Region / state</span>
            <input name="region" placeholder="WA" />
          </label>
          <label className="field">
            <span>Country</span>
            <input name="country" placeholder="US" />
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Date</span>
            <input name="date" type="date" required />
          </label>
          <label className="field">
            <span>Time</span>
            <input name="time" type="time" />
          </label>
        </div>
        <label className="field">
          <span>Ticket URL (optional)</span>
          <input name="ticketUrl" type="url" placeholder="https://" />
        </label>
        <div className="row-actions">
          <button className="btn" type="submit">
            Save show
          </button>
          <button className="btn ghost" type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
