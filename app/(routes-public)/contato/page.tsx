"use client";

import { Button } from "@/app/components/ui/button";
import { Separator } from "@/app/components/ui/separator";
import { Info, MessagesSquare, ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";


export default function Contact() {

    return (

        <div className=" flex flex-col  bg-white rounded-md min-h-[70vh] px-60 max-md:px-0 mx-auto py-8 gap-4">
            <h2 className="text-2xl font-semibold">Contato</h2>
            <Separator></Separator>
            <div className="w-full   p-4  rounded-md  grid grid-cols-2 max-md:grid-cols-1 gap-10">
                <Link href={process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT || ""}>
                    <div className=" border-green-500 transition-all hover:border-solid hover:scale-110 border-dotted border-2 min-h-[300px] rounded-md text-green-500 flex flex-col items-center justify-center">
                        <Image src="/WhatsApp.webp" alt="logo zapzap" width={100} height={140}></Image>
                        <h2 className="font-semibold">Whatsapp</h2>
                    </div>
                </Link>
                <Link href={process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT || ""}>
                    <div className=" border-blue-500 transition-all hover:border-solid hover:scale-110 border-dotted border-2 min-h-[300px] rounded-md text-blue-500 flex flex-col items-center justify-center">
                        <Image src="/Telegram.png" alt="logo zapzap" width={100} height={140}></Image>
                        <h2 className="font-semibold">Telegram</h2>
                    </div>
                </Link>
            </div>
        </div>

    );
}
