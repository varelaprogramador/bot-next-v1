import React, { useCallback, useEffect, useState } from 'react'
import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel'
import { DotButton, useDotButton } from './EmblaCarouselDotButton'
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './EmblaCarouselArrowButtons'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'
import Link from 'next/link'
import { useIsMobile } from '@/hooks/use-mobile'
import { MediaProps } from '@/app/utils/media'
import { createClient } from '@/lib/supabase/client'
import Image from "next/image";

type PropType = {
  slides: number[]
  options?: EmblaOptionsType
}

const EmblaCarousel: React.FC<PropType> = ({ slides, options }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(options, [Autoplay()])
  const supabase = createClient()

  const [dataBannerDesk, setDataBannerDesk] = useState<MediaProps[]>([])
  const [dataBannerNote, setDataBannerNote] = useState<MediaProps[]>([])

  const mobile = useIsMobile()

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase.from("media-loja").select("*")
        if (error) throw error

        setDataBannerDesk(data.filter((value) => value.type === 'desktop'))
        setDataBannerNote(data.filter((value) => value.type === 'mobile'))
      } catch (error) {
        console.error("Erro ao carregar dados:", error)
      }
    }

    loadData()
  }, [supabase])

  const { selectedIndex, scrollSnaps, onDotButtonClick } = useDotButton(emblaApi)
  const { prevBtnDisabled, nextBtnDisabled, onPrevButtonClick, onNextButtonClick } = usePrevNextButtons(emblaApi)

  return (
    <section className="relative embla">
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((index) => (
            <div className="embla__slide relative flex items-center justify-center" key={index}>
              {(mobile ? dataBannerNote : dataBannerDesk).map((card) => (
                <Link key={card.id} href={`/card/${card.id}`} className="w-full max-h-[800px] flex-shrink-0 rounded-md">
                  <Image
                    src={card.url || "/placeholder.svg"}
                    unoptimized
                    alt={card.nome}
                    width={2000}
                    height={800}
                    className="w-full rounded-md object-cover bg-center max-h-[800px]"
                  />
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>


      <div className="embla__controls absolute inset-0 flex justify-between items-center px-4">
        <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
        <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
      </div>
    </section>
  )
}

export default EmblaCarousel
