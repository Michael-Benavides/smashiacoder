import { cn } from '@/lib/utils'

export function BrandName({ className, accentClass = 'text-amber-400', as: Tag = 'span' }) {
  return (
    <Tag className={className}>
      Smash<span className={accentClass}>IA</span>CodeR
    </Tag>
  )
}
