"use client";

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";
import {
  ChevronLeft,
  ChevronRight,
  GalleryHorizontal,
  ImageIcon,
  ShoppingBasketIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/app/components/ui/separator";
import Carousel from "./_components/carousel/component";
import { useIsMobile } from "@/hooks/use-mobile";

import { EmblaOptionsType } from "embla-carousel";

import { DataTableMediaBanner } from "@/app/components/tabela-loja-banner";

import { Card, CardContent } from "@/app/components/ui/card";
import OptionCard from "./_components/option-card";

export default function Shop() {
  return (
    <div className="p-4 min-h-[85vh] flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold ">Configure sua loja</h1>
        <h2 className="font-semibold">Layout da Loja</h2>
      </div>
      <Separator className=" my-4"></Separator>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
        <OptionCard
          link="/produtos"
          title="Produtos"
          icon="produtos"
          delay={0}
        />
        <OptionCard link="/banner" title="Banner" icon="banner" delay={1} />
        <OptionCard
          link="/carousel"
          title="Carousel"
          icon="carousel"
          delay={2}
        />
      </div>
    </div>
  );
}
