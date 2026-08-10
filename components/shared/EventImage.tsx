'use client'

import Image, { ImageProps } from 'next/image'
import { useEffect, useMemo, useState } from 'react'
import { getCategorySvg, getEventImage, normalizeImageUrl } from '@/lib/eventImages'

type EventImageProps = Omit<ImageProps, 'src'> & {
  src?: string | null
  category?: string | null
  title?: string
}

export default function EventImage({
  src,
  category,
  title,
  alt,
  onError,
  ...props
}: EventImageProps) {
  const svgFallback = useMemo(() => getCategorySvg(category, title), [category, title])

  const resolved = useMemo(() => {
    const primary = getEventImage(category, normalizeImageUrl(src), title)
    return primary || svgFallback
  }, [src, category, title, svgFallback])

  const [currentSrc, setCurrentSrc] = useState(resolved)
  const [usedSvg, setUsedSvg] = useState(false)

  useEffect(() => {
    setCurrentSrc(resolved)
    setUsedSvg(false)
  }, [resolved])

  return (
    <Image
      {...props}
      alt={alt}
      src={currentSrc}
      onError={(event) => {
        if (!usedSvg && currentSrc !== svgFallback) {
          setCurrentSrc(svgFallback)
          setUsedSvg(true)
          return
        }
        onError?.(event)
      }}
    />
  )
}
