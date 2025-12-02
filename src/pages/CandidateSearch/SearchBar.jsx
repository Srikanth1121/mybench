import React, { useState } from "react";

export default function SearchBar({
  value = "",
  onChange = () => {},
  onSearch = () => {},
  onClear = () => {},
  filters = {},
  onFiltersChange = () => {}
}) {

  const [query, setQuery] = useState(value);

  function handleInput(e) {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
  }

  function triggerSearch() {
    onSearch(query.trim());
  }

  function clearAll() {
    setQuery("");
    onChange("");
    onClear();
  }

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm p-4 mb-4">
      <label className="block text-sm font-medium mb-2">Skill Search</label>

      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={(e) => e.key === "Enter" && triggerSearch()}
        placeholder={'e.g. "Java Developer" AND Spring NOT Fresher'}
        className="w-full border border-zinc-300 rounded-lg p-3 text-sm"
      />

     <div className="flex items-center gap-2 mt-3 flex-nowrap">


        <button
          onClick={triggerSearch}
          className="bg-primary-600 text-black rounded-lg px-4 py-2 text-sm font-medium"
        >
          Search
        </button>

        <button
          onClick={clearAll}
          className="border border-zinc-300 bg-white rounded-lg px-4 py-2 text-sm"
        >
          Clear
        </button>
        <select
  value={filters.source}
  onChange={(e) =>
    onFiltersChange((prev) => ({ ...prev, source: e.target.value }))
  }
  className="border border-zinc-300 rounded-lg px-3 py-2 text-sm"
>
  <option value="all">All Candidates</option>
  <option value="bench">Only Bench</option>
  <option value="independent">Only Independent</option>
</select>
      </div>


      <p className="text-xs text-zinc-500 mt-3">
        Supported: AND, OR, NOT, "Exact Phrases"
      </p>
    </div>
  );
}