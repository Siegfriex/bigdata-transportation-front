import type { ImgHTMLAttributes } from 'react'
import { cn } from '../lib'

const iconSources = {
  filter: new URL('../assets/figma-guide/filter.svg', import.meta.url).href,
  list: new URL('../assets/figma-guide/list.svg', import.meta.url).href,
  location: new URL('../assets/figma-guide/location.svg', import.meta.url).href,
  refresh: new URL('../assets/figma-guide/refresh.svg', import.meta.url).href,
  search: new URL('../assets/figma-guide/search.svg', import.meta.url).href,
} as const

export type IconName = keyof typeof iconSources
export type IconProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'alt' | 'src'> & {
  name: IconName
  label?: string
}

export function Icon({ className, label, name, ...props }: IconProps) {
  return <img {...props} className={cn('ui-icon', className)} src={iconSources[name]} alt={label ?? ''} aria-hidden={label ? undefined : true} />
}
