export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 text-lg font-black text-white">
        J
      </div>
      <div className="leading-tight">
        <div className="text-base font-semibold whitespace-nowrap">
          <span className="text-slate-900 dark:text-white">Jayarathna</span>
          <span className="text-blue-600 dark:text-blue-400">Tech</span>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">Solutions</div>
      </div>
    </div>
  )
}
