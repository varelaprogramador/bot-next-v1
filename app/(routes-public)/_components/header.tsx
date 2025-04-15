"use client";
import InputSearch from "@/app/components/search-input"
import { Button } from "@/app/components/ui/button"
import { ListBulletIcon } from "@radix-ui/react-icons"
import { X } from "lucide-react";
import Link from "next/link"
import { useState } from "react"

export const Menu = () => {
    const [isOpen, setIsOpen] = useState(false);


    return (
        <>
            <header className="bg-white w-full  rounded-md sticky top-2 z-40 shadow-md
         shadow-[#00000057]">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-8">
                            <Link href="/" className="text-gray-900 font-bold text-2xl">
                                Next Gift Cards                            </Link>
                            <nav className="hidden xl:flex items-center gap-6 ">
                                <Link href="/" className="text-gray-600 hover:text-gray-900">
                                    Inicial
                                </Link>
                                <Link href="/duvidas" className="text-gray-600 hover:text-gray-900">
                                    Duvidas Frequentes
                                </Link>
                                <Link href="/contato" className="text-gray-600 hover:text-gray-900">
                                    Contato
                                </Link>
                            </nav>
                        </div>
                        <div className="hidden xl:flex items-center gap-4">
                            <InputSearch></InputSearch>

                        </div>
                        <Button onClick={() => setIsOpen(!isOpen)} className="max-xl:flex hidden" variant="outline">
                            <ListBulletIcon></ListBulletIcon>
                        </Button>
                    </div>
                </div>
                <nav className="bg-gray-900 rounded-b-md hidden xl:flex">
                    <div className="min-h-[30px] mx-auto px-4">

                    </div>
                </nav>
                <nav className="bg-gray-900 rounded-b-md p-2 max-xl:flex hidden ">
                    <div className="container mx-auto px-4 flex items-center justify-center">
                        <InputSearch></InputSearch>
                    </div>
                </nav>
            </header>
            {
                isOpen && (
                    <div className=" bg-white fixed w-full  min-h-screen top-0 left-0 z-50">
                        <button onClick={() => setIsOpen(!isOpen)} className=" absolute top-4 right-4">
                            <X ></X>
                        </button>
                        <nav className="flex flex-col items-center justify-center gap-8 min-h-screen">
                            <Link onClick={() => setIsOpen(!isOpen)} href="/" className="text-gray-600 hover:text-gray-900 text-2xl">
                                <div className="min-w-[100vw] text-center p-4 hover:bg-gray-100">
                                    Inicial</div>
                            </Link>
                            <Link onClick={() => setIsOpen(!isOpen)} href="/duvidas" className="text-gray-600 hover:text-gray-900 text-2xl">
                                <div className="min-w-[100vw] text-center p-4 hover:bg-gray-100">
                                    Duvidas Frequentes</div>
                            </Link>
                            <Link onClick={() => setIsOpen(!isOpen)} href="/contato" className="text-gray-600 hover:text-gray-900 text-2xl">
                                <div className="min-w-[100vw] text-center p-4 hover:bg-gray-100">
                                    Contato</div>
                            </Link>
                        </nav>
                    </div>)
            }
        </>
    )
}