"use client";
import React, { useCallback } from 'react'
import { EmblaOptionsType, EmblaCarouselType } from 'embla-carousel'
import {
  PrevButton,
  NextButton,
  usePrevNextButtons
} from './EmblaCarouselArrowButtons'
import Autoplay from 'embla-carousel-autoplay'
import useEmblaCarousel from 'embla-carousel-react'

type PropType = {
  slides: React.JSX.Element[]
  options?: EmblaOptionsType
}

const EmblaCarouselCircle: React.FC<PropType> = (props) => {
  const { slides, options } = props
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { containScroll: "trimSnaps" }, // Adiciona essa opção
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const onNavButtonClick = useCallback((emblaApi: EmblaCarouselType) => {
    const autoplay = emblaApi?.plugins()?.autoplay
    if (!autoplay) return

    const resetOrStop =
      autoplay.options.stopOnInteraction === false
        ? autoplay.reset
        : autoplay.stop

    resetOrStop()
  }, [])

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick
  } = usePrevNextButtons(emblaApi, onNavButtonClick)

  return (
    <section className="embla_circle">

      <div className="embla__viewport_circle" ref={emblaRef}>
        <div className="embla__container_circle">
          {slides.map((item, index) => (
            <div className="embla__slide_circle" key={index}>
              <div className="embla__slide__number_circle">{item}</div>
            </div>
          ))}
        </div>
      </div>


    </section>
  )
}

export default EmblaCarouselCircle;
