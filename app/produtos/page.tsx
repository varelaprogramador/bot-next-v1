'use client'

import { CreateProduto } from "@/components/create-forms/produto";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon, Binary, Calendar, CircleDollarSign, Edit, FilePlus, SquareMousePointer, Trash2 } from "lucide-react";
import Link from "next/link";
// import { createClient } from '@supabase/supabase-js'

// // Create a single supabase client for interacting with your database
// const supabase = createClient(`${process.env.SUPABASE_URL}`, `${process.env.SUPABASE_URL}`);


export default function Produtos() {

    const vendas = [
        {
            id: "12345",
            produto: "Produto A",
            valor: 100.0,
            status: "Concluída",
        },
        {
            id: "12346",
            produto: "Produto B",
            valor: 50.0,
            status: "Pendente",
        },
        {
            id: "12347",
            produto: "Produto C",
            valor: 200.0,
            status: "Cancelada",
        },
    ];



    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Area de produtos</h1>
            <div className=" grid grid-cols-3 gap-8">
                <CreateProduto onConfirmCreate={() => { }}></CreateProduto>

                <article className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110">
                    <header className="flex px-4 pt-4 justify-between">
                        <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                            <div className="flex justify-between"> <h1 className="text-2xl font-semibold">Produto teste</h1> 
                            <div className="flex items-center gap-2 ">
                            <div className="p-1 font-medium text-sm  border text-blue-500 border-blue-500 rounded ">
                                categoria</div>
                            <Link href={''} className="hover:bg-gray-300 hover:text-black p-2 rounded"><SquareMousePointer  /></Link> </div></div>
                            
                            <p className="text-sm break-words overflow-hidden text-ellipsis">
                                
                                dasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjs
                            </p>
                        </div>

                    </header>

                  
                    
                    <footer className="flex flex-col gap-2  w-full px-4">
                    <div className="flex items-center gap-2 justify-start  w-full text-[0.7rem]">
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <CircleDollarSign size={20} /> R$ 2k
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Binary size={20} />0
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Calendar size={20} /> 23/01/2025
                        </div>
                    </div>
                    <div className="flex  gap-2 w-full ">
                        <Button className="w-full ">Acessar <ArrowRightIcon size={15}></ArrowRightIcon></Button><Button ><Edit></Edit></Button> <Button variant={'destructive'}><Trash2></Trash2></Button>
                    </div></footer>
                   
                </article>

                <article className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110">
                    <header className="flex px-4 pt-4 justify-between">
                        <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                            <div className="flex justify-between"> <h1 className="text-2xl font-semibold">Produto teste</h1> 
                            <div className="flex items-center gap-2 ">
                            <div className="p-1 font-medium text-sm  border text-blue-500 border-blue-500 rounded ">
                                categoria</div>
                            <Link href={''} className="hover:bg-gray-300 hover:text-black p-2 rounded"><SquareMousePointer  /></Link> </div></div>
                            
                            <p className="text-sm break-words overflow-hidden text-ellipsis">
                                
                                dasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjs
                            </p>
                        </div>

                    </header>

                  
                    
                    <footer className="flex flex-col gap-2  w-full px-4">
                    <div className="flex items-center gap-2 justify-start  w-full text-[0.7rem]">
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <CircleDollarSign size={20} /> R$ 2k
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Binary size={20} />0
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Calendar size={20} /> 23/01/2025
                        </div>
                    </div>
                    <div className="flex  gap-2 w-full ">
                        <Button className="w-full ">Acessar <ArrowRightIcon size={15}></ArrowRightIcon></Button><Button ><Edit></Edit></Button> <Button variant={'destructive'}><Trash2></Trash2></Button>
                    </div></footer>
                   
                </article>
                <article className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110">
                    <header className="flex px-4 pt-4 justify-between">
                        <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                            <div className="flex justify-between"> <h1 className="text-2xl font-semibold">Produto teste</h1> 
                            <div className="flex items-center gap-2 ">
                            <div className="p-1 font-medium text-sm  border text-blue-500 border-blue-500 rounded ">
                                categoria</div>
                            <Link href={''} className="hover:bg-gray-300 hover:text-black p-2 rounded"><SquareMousePointer  /></Link> </div></div>
                            
                            <p className="text-sm break-words overflow-hidden text-ellipsis">
                                
                                dasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjs
                            </p>
                        </div>

                    </header>

                  
                    
                    <footer className="flex flex-col gap-2  w-full px-4">
                    <div className="flex items-center gap-2 justify-start  w-full text-[0.7rem]">
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <CircleDollarSign size={20} /> R$ 2k
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Binary size={20} />0
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Calendar size={20} /> 23/01/2025
                        </div>
                    </div>
                    <div className="flex  gap-2 w-full ">
                        <Button className="w-full ">Acessar <ArrowRightIcon size={15}></ArrowRightIcon></Button><Button ><Edit></Edit></Button> <Button variant={'destructive'}><Trash2></Trash2></Button>
                    </div></footer>
                   
                </article>
                <article className="border flex flex-col justify-between pb-4 gap-12 rounded transition-all duration-300 hover:scale-110">
                    <header className="flex px-4 pt-4 justify-between">
                        <div className="flex flex-col h-[150px] max-h-[90px] w-full overflow-hidden">
                            <div className="flex justify-between"> <h1 className="text-2xl font-semibold">Produto teste</h1> 
                            <div className="flex items-center gap-2 ">
                            <div className="p-1 font-medium text-sm  border text-blue-500 border-blue-500 rounded ">
                                categoria</div>
                            <Link href={''} className="hover:bg-gray-300 hover:text-black p-2 rounded"><SquareMousePointer  /></Link> </div></div>
                            
                            <p className="text-sm break-words overflow-hidden text-ellipsis">
                                
                                dasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjsdasdansdnbnjdasçfdnaçdsfnsanfdçndsjnfjsafkjs
                            </p>
                        </div>

                    </header>

                  
                    
                    <footer className="flex flex-col gap-2  w-full px-4">
                    <div className="flex items-center gap-2 justify-start  w-full text-[0.7rem]">
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <CircleDollarSign size={20} /> R$ 2k
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Binary size={20} />0
                        </div>
                        <div className="flex items-center justify-center gap-2 text-gray-800 ">
                            <Calendar size={20} /> 23/01/2025
                        </div>
                    </div>
                    <div className="flex  gap-2 w-full ">
                        <Button className="w-full ">Acessar <ArrowRightIcon size={15}></ArrowRightIcon></Button><Button ><Edit></Edit></Button> <Button variant={'destructive'}><Trash2></Trash2></Button>
                    </div></footer>
                   
                </article>


            </div>

            
        </div>
    );
}
