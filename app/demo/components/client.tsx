"use client"

import Image from "next/image"
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState } from "react";

import {
    useSensor,
    DndContext,
    useSensors,
    DragOverlay,
    DragEndEvent,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    DragStartEvent,
} from '@dnd-kit/core'

import {
    arrayMove,
    useSortable,
    SortableContext,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ProdutosLojaProps } from "@/app/utils/produto";
import { Card, CardContent, CardFooter } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import Link from "next/link";

export const Client = () => {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ProdutosLojaProps[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    )

    const handleDragStart = (event: DragStartEvent) => {
        if (loading) return
        setActiveId(event.active.id.toString())
    }

    const handleDragEnd = (event: DragEndEvent) => {
        if (loading) return

        const { active, over } = event

        if (active.id === over?.id) return

        const activeIndex = data.findIndex(i => i.id === active.id)
        const overIndex = data.findIndex(i => i.id === over?.id)

        const newItems = arrayMove(data, activeIndex, overIndex).map((item, index) => ({
            ...item,
            position: index + 1,
        }))
        setData(newItems)
    }

    const handleUpdatePositions = async () => {
        if (loading) return
        setLoading(true)
        await Promise.all(
            data.map((item) =>
                supabase.from("produtos").update({
                    position: item.position,
                }).eq("id", item.id)
            )
        )
            .then(() => {
                toast.success("Dados salvos com sucesso!")
            })
            .catch((error) => {
                toast.error("Erro ao salvar dados!")
                console.error("Erro ao salvar dados:", error)
            })
            .finally(() => setLoading(false))
    }

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase.from("produtos").select("*").order("position");

                if (error) {
                    throw error;
                }

                setData(data
                    || []);
            } catch (error) {
                console.error("Erro ao carregar dados:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [supabase]);

    return <div className="min-h-dvh overflow-x-hidden flex flex-col">
        <DndContext
            sensors={sensors}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            collisionDetection={closestCenter}
        >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-1">
                <SortableContext items={data} strategy={rectSortingStrategy} disabled={loading}>
                    {
                        data.map((product,) => <ProductCard key={product.id} product={product} />)
                    }

                    <DragOverlay>
                        {activeId ? (
                            <ProductCard
                                product={data.find(i => i.id === activeId)!}
                            />
                        ) : null}
                    </DragOverlay>
                </SortableContext>
            </div>
        </DndContext>

        <Button
            disabled={loading}
            onClick={handleUpdatePositions}
        >
            Update {loading && <Loader2 className="animate-spin" />}
        </Button>
    </div>
}

const ProductCard = ({ product }: { product: ProdutosLojaProps }) => {
    const {
        listeners,
        transform,
        attributes,
        setNodeRef,
        transition,
        isDragging,
    } = useSortable({ id: product.id })

    return <Card
        {...listeners}
        {...attributes}
        ref={setNodeRef}
        className={cn("overflow-hidden bg-gray-100 border shadow-none",
            isDragging && "opacity-50",
        )}
        style={{
            transform: CSS.Transform.toString(transform),
            transition,
        }}
    >

        <CardContent className="p-4 max-md:flex gap-4 max-md:p-0">
            <div className="bg-blue-600 hover:bg-blue-500 py-2 rounded-md flex-shrink-0 min-w-[150px] ">
                <p className="text-center text-white">
                    {product.categoria}
                </p>
                <div className="aspect-square relative ">
                    <Image
                        fill
                        priority
                        sizes="100%"
                        draggable={false}
                        alt={product.nome}
                        className="object-contain"
                        src={product.url_image || "/placeholder.svg"}
                    />

                    <div className="absolute top-2 text-sm  font-semibold left-2 bg-black text-emerald-400 p-1 size-8 shadow-sm flex items-center justify-center rounded-full shadow-emerald-400">
                        {product.position}
                    </div>
                </div>


            </div>
            <div className="flex flex-col justify-center">
                <h3 className="font-semibold text-lg mb-2">{product.nome}</h3>
                <div className="text-green-600">
                    no pix R${(product.valor || 0).toFixed(2)}
                </div>
                <div className="text-gray-600">
                    R${(product.valor * 1.1 || 0).toFixed(2)} no cartão
                </div>

                <Button className="w-full bg-gray-900 hover:bg-gray-800  hidden max-md:flex">
                    Comprar
                </Button>
            </div>

        </CardContent>
        <CardFooter>

            <Button className="w-full bg-gray-900 hover:bg-gray-800 flex max-md:hidden">
                Comprar
            </Button>

        </CardFooter>
    </Card>

}