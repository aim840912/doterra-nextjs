'use client'

import type {
  FilterOption,
  KnowledgeFilterState,
} from './utils/knowledgeFilters'

interface KnowledgeFiltersProps {
  filters: KnowledgeFilterState
  aromaOptions: FilterOption[]
  topicOptions: FilterOption[]
  resultCount: number
  totalCount: number
  hasFilters: boolean
  onSearchChange: (value: string) => void
  onToggleAroma: (value: string) => void
  onToggleTopic: (value: string) => void
  onClear: () => void
}

interface PillGroupProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onToggle: (value: string) => void
}

function PillGroup({ label, options, selected, onToggle }: PillGroupProps) {
  if (options.length === 0) return null

  return (
    <fieldset>
      <legend className="text-sm font-medium text-gray-700 mb-2">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map(({ value, count }) => {
          const isOn = selected.includes(value)
          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(value)}
              aria-pressed={isOn}
              className={`min-h-[36px] px-3 rounded-full text-sm transition-colors border ${
                isOn
                  ? 'bg-green-600 text-white border-green-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-green-400 hover:text-green-700'
              }`}
            >
              {value}
              <span className={isOn ? 'text-green-100' : 'text-gray-400'}>
                {' '}
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default function KnowledgeFilters({
  filters,
  aromaOptions,
  topicOptions,
  resultCount,
  totalCount,
  hasFilters,
  onSearchChange,
  onToggleAroma,
  onToggleTopic,
  onClear,
}: KnowledgeFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-5">
      <div>
        <label htmlFor="knowledge-search" className="sr-only">
          搜尋精油小知識
        </label>
        <input
          id="knowledge-search"
          type="search"
          value={filters.search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="搜尋精油名稱、功效或編號，例如「睡眠」「O-27」"
          className="w-full min-h-[44px] px-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      <PillGroup
        label="香味族群"
        options={aromaOptions}
        selected={filters.aromaFamilies}
        onToggle={onToggleAroma}
      />
      <PillGroup
        label="功效主題"
        options={topicOptions}
        selected={filters.topics}
        onToggle={onToggleTopic}
      />

      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
        <p className="text-sm text-gray-600 pt-3">
          {hasFilters ? (
            <>
              篩出 <strong className="text-green-700">{resultCount}</strong> 張
              / 共 {totalCount} 張
            </>
          ) : (
            <>共 {totalCount} 張卡片</>
          )}
        </p>
        {hasFilters && (
          <button
            onClick={onClear}
            className="text-sm text-gray-500 hover:text-green-700 underline underline-offset-4 pt-3"
          >
            清除篩選
          </button>
        )}
      </div>
    </div>
  )
}
