"use client";
import * as React from "react";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/app/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/app/components/ui/drawer";
import { Input } from "@/app/components/ui/input";

import ImageSelector from "../popup-imagens";
import { MediaProps } from "@/app/utils/media";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import Image from "next/image";



interface DialogCreateMediaProps {
    onConfirmCreate: (args: { data: MediaProps }) => void;
}


const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    url: z.string().trim().min(1, "Campo Obrigatório!"),
    status: z.boolean(),
    rota: z.string().trim().min(1, "Campo Obrigatório!"),
    type: z.string().trim().min(1, "Campo Obrigatório!")
});

export const CreateBanner = ({
    onConfirmCreate,
}: DialogCreateMediaProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const isDesktop = !useIsMobile();

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            url: "",
            status: true,
            rota: "",
            type: "desktop"
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        console.log(values)
        onConfirmCreate({
            data: values
        });
        setOpen(false);
        form.reset();
    };
    const [urlImage, setUrlImage] = useState("/placeholder.svg");
    const handlerUrl = (url: string) => {
        form.setValue("url", url);
        setUrlImage(url);
    };

    const FormContent = (
        <Form {...form}>
            <form
                className="grid items-start gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <div className="min-w-[300px] flex justify-center h-[150px] bg-gray-100 rounded-md">
                    <Image
                        alt="mockup"
                        src={urlImage}
                        width={400}
                        height={400}
                        className="bg-cover object-cover rounded-md w-full"
                    />
                </div>

                <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Url da Imagem</FormLabel>
                            <FormControl>
                                <Input placeholder="url_image" readOnly value={field.value} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <ImageSelector defaultValue="" sendData={handlerUrl} onClose={() => { }} />
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Alt da Imagem</FormLabel>
                            <FormControl>
                                <Input placeholder="Alt" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Status</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={(value) => field.onChange(value === "true")}
                                    value={String(field.value)}
                                >
                                    <SelectTrigger className="w-full ">
                                        <SelectValue placeholder="Selecione um status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="true">Visível</SelectItem>
                                        <SelectItem value="false">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="rota"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Rotas :</FormLabel>
                            <FormControl>
                                <Input placeholder="https://teste.com.br" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tipo:</FormLabel>
                            <FormControl>
                                <Select
                                    onValueChange={(value) => field.onChange(value)}
                                    value={String(field.value)}
                                >
                                    <SelectTrigger className="w-full ">
                                        <SelectValue placeholder="Selecione um tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mobile">mobile</SelectItem>
                                        <SelectItem value="desktop">desktop</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />


                <Button type="submit" disabled={loading}>
                    {loading ? "Criando..." : "Criar Banner"}
                </Button>
            </form>
        </Form>
    );

    return isDesktop ? (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) form.reset();
            }}
        >
            <DialogTrigger asChild>
                <Button>Criar Banner</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Criar Novo Banner</DialogTitle>
                    <DialogDescription>
                        Preencha as informações do novo Banner abaixo.
                    </DialogDescription>
                </DialogHeader>
                {FormContent}
            </DialogContent>
        </Dialog>
    ) : (
        <Drawer
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen);
                if (!isOpen) form.reset();
            }}
        >
            <DrawerTrigger asChild>
                <Button>Criar Banner</Button>
            </DrawerTrigger>
            <DrawerContent className="p-4">
                <DrawerHeader>
                    <DrawerTitle>Criar Novo Banner</DrawerTitle>
                    <DrawerDescription>
                        Preencha as informações do novo Banner abaixo.
                    </DrawerDescription>
                </DrawerHeader>
                {FormContent}
                <DrawerFooter className="flex justify-end mt-4">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};

function setOpen(arg0: boolean) {
    throw new Error("Function not implemented.");
}
