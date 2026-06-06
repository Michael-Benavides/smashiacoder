export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {Icon && <div className="mb-4 p-4 bg-zinc-100 rounded-2xl"><Icon size={28} className="text-zinc-400" /></div>}
      <h3 className="text-sm font-semibold text-zinc-700 mb-1">{title}</h3>
      {description && <p className="text-sm text-zinc-500 max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  )
}
