"use client";

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeftCircle,
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

import { useIsMobile } from "@/hooks/use-mobile";

import { EmblaOptionsType } from "embla-carousel";

import { DataTableMediaBanner } from "@/app/components/tabela-loja-banner";

import { Card, CardContent } from "@/app/components/ui/card";
import Carousel from "../_components/carousel/component";

export default function CarouselLayoutShop() {
  return (
    <div className="p-4 min-h-[85vh] flex flex-col gap-4">
      <div className=" flex flex-col gap-4 items-center ">
        <div className=" flex justify-between bg-white rounded-md p-2 fixed z-10  w-[85%] shadow-md">
          <div className="flex gap-4 items-center ">
            <Button
              onClick={() => (window.location.href = "/loja")}
              className="bg-blue-600 hover:bg-blue-400"
            >
              <ArrowLeftCircle></ArrowLeftCircle>
            </Button>{" "}
            <p className="border-l pl-1 font-semibold"> Carousel</p>
          </div>
        </div>
      </div>
      <Separator className=" my-4"></Separator>

      <div>
        <Carousel></Carousel>
      </div>
    </div>
  );
}
