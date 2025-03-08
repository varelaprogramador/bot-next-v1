'use client';

import { DataTableMediaCarousel } from "@/app/components/tabela-loja";
import { Button } from "@/app/components/ui/button";
import { MediaBannerProps, MediaProps } from "@/app/utils/media";
import { createClient } from "@/lib/supabase/client";
import { ChevronLeft, ChevronRight, GalleryHorizontal, ImageIcon, ShoppingBasketIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Separator } from "@/app/components/ui/separator";

import { useIsMobile } from "@/hooks/use-mobile";

import { EmblaOptionsType } from 'embla-carousel'

import { DataTableMediaBanner } from "@/app/components/tabela-loja-banner";
import { Client } from "@/app/demo/components/client";
import { Card, CardContent } from "@/app/components/ui/card";


export default function ProdutosLayoutLoja() {

  return (
    <div className="p-4 min-h-[85vh] flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold ">Configure sua loja</h1>
        <h2 className="font-semibold">Layout da Loja</h2>
      </div>
      <Separator className=" my-4"></Separator>

      <div>
        <Client></Client>

      </div>

    </div>
  );
}
