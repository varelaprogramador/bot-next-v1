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
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/components/ui/form";
import { FilePlus, ShoppingBag } from "lucide-react";
import { PhoneInput } from "./phone";
import { toast } from "sonner";
import { ProdutosProps } from "@/app/utils/produto";
import { v4 } from "uuid";
import { Value } from "@radix-ui/react-select";
import Image from "next/image";
import Link from "next/link";

interface DialogInfoCheckout {
    isOpen: boolean, produto: ProdutosProps, setIsOpen: (open: boolean) => void
}

const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    telefone: z.string().trim().min(1, "Campo Obrigatório!"),
    email: z.string().optional()
});

export const InfoCheckout = ({
    isOpen, setIsOpen, produto
}: DialogInfoCheckout) => {

    const [openQR, setOpenQR] = useState(false);
    const [dataQR, setDataQR] = useState({
        charge: {
            qrCodeImage: "/placeholder.svg",
            value: 0,
            comment: "",
            identifier: "",
            status: "",
            expiresDate: "",
            pixKey: "",
            paymentLinkUrl: "#",
            expiresIn: 0,
            brCode: "#",
            correlationID: "",
        }
    });
    const [loading, setLoading] = useState(false);
    const [pagamentoConcluido, setPagamentoConcluido] = useState(false);
    const [verificandoPagamento, setVerificandoPagamento] = useState(false);
    const [erroVerificacao, setErroVerificacao] = useState(false);
    const isDesktop = !useIsMobile();
    const intervalRef = React.useRef<NodeJS.Timeout | null>(null);

    // Função para verificar o status do pagamento
    const verificarStatusPagamento = async () => {
        if (!dataQR.charge.correlationID) return;

        try {
            setVerificandoPagamento(true);
            setErroVerificacao(false);

            const response = await fetch(`/api/payaments/verificar-status`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    correlationID: dataQR.charge.correlationID
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.status === "COMPLETED" || data.status === "concluida") {
                    setPagamentoConcluido(true);

                    // Opcionalmente, enviar uma mensagem de WhatsApp de confirmação
                    enviarConfirmacaoWhatsApp();

                    // Parar a verificação quando o pagamento for concluído
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = null;
                    }
                }
            } else {
                console.error("Erro na resposta da API de verificação:", response.statusText);
                setErroVerificacao(true);
            }
        } catch (error) {
            console.error("Erro ao verificar status do pagamento:", error);
            setErroVerificacao(true);
        } finally {
            setVerificandoPagamento(false);
        }
    };

    // Função para enviar mensagem de confirmação via WhatsApp
    const enviarConfirmacaoWhatsApp = () => {
        try {
            const whatsappLink = process.env.NEXT_PUBLIC_WHATSAPP_CHECKOUT;
            if (whatsappLink && whatsappLink !== "#") {
                const telefone = form.getValues('telefone')?.replace(/\D/g, '');
                if (telefone) {
                    const mensagem = encodeURIComponent(
                        `Olá! Seu pagamento para ${produto.nome} foi confirmado. Obrigado pela compra!`
                    );

                    // Usar setTimeout para evitar bloqueio do navegador
                    setTimeout(() => {
                        window.open(`${whatsappLink}?phone=${telefone}&text=${mensagem}`, '_blank');
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("Erro ao enviar confirmação WhatsApp:", error);
            // Não interromper o fluxo principal se isso falhar
        }
    };

    // Iniciar a verificação periódica quando o QR for gerado
    useEffect(() => {
        if (openQR && !pagamentoConcluido && dataQR.charge.correlationID) {
            // Verificar imediatamente
            verificarStatusPagamento();

            // Verificar a cada 5 segundos
            intervalRef.current = setInterval(verificarStatusPagamento, 5000);
        }

        return () => {
            // Limpar o intervalo quando o componente for desmontado
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [openQR, dataQR.charge.correlationID, pagamentoConcluido]);

    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            telefone: "",
            email: ""
        },
    });

    const onSubmit = (values: z.infer<typeof schema>) => {
        setIsOpen(false);
        form.reset();
    };
    const generatePix = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/payaments/open-pix", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    produto: { nome: produto.nome, id: produto.id, valor: produto.valor },
                    nome: form.getValues('nome'),
                    email: form.getValues('email') || "",
                    telefone: form.getValues('telefone'),
                    origin: "site",
                }),
            });

            if (!response.ok) {
                throw new Error(`Erro ao gerar PIX: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.charge || !data.charge.correlationID) {
                throw new Error("Dados de PIX inválidos recebidos do servidor");
            }

            // Garantir que o correlationID está sendo armazenado
            setDataQR({
                ...data,
                charge: {
                    ...data.charge,
                    correlationID: data.charge.correlationID
                }
            });

            setOpenQR(true);
            setPagamentoConcluido(false);
            setErroVerificacao(false);

        } catch (error) {
            console.error("Erro ao gerar PIX:", error);
            toast.error("Erro ao gerar PIX. Tente novamente.");
        } finally {
            setLoading(false);
        }
    }
    const FormContent = (
        <Form {...form}>
            <form
                className="grid items-start gap-4"
                onSubmit={form.handleSubmit(onSubmit)}
            >
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome Completo</FormLabel>
                            <FormControl>
                                <Input placeholder="Jhon Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Whatsapp</FormLabel>
                            <FormControl>
                                <PhoneInput {...field} defaultCountry="BR" placeholder="+55 00 90000-0000"></PhoneInput>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="example@gmail.com(opcional)" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="button" disabled={loading} onClick={generatePix}>
                    {loading ? "Gerando..." : "Gerar Pix"}
                </Button>
            </form>
        </Form>
    );
    const QRContent = (
        <>
            <div className="grid items-center justify-center gap-4">
                {pagamentoConcluido ? (
                    <div className="flex flex-col items-center justify-center gap-4">
                        <div className="bg-green-100 text-green-800 p-4 rounded-md flex items-center gap-2 w-full">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span className="font-medium">Pagamento concluído com sucesso!</span>
                        </div>
                        <p className="text-center text-sm text-gray-500">
                            Seu pagamento foi confirmado. O produto será entregue conforme as instruções.
                        </p>
                        <Button onClick={() => setIsOpen(false)} className="w-full mt-2">
                            Fechar
                        </Button>
                    </div>
                ) : (
                    <>
                        {erroVerificacao && (
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-md mb-2 text-sm">
                                Estamos com dificuldades para verificar o status do pagamento. Caso já tenha pago, entre em contato conosco.
                            </div>
                        )}

                        {verificandoPagamento && (
                            <div className="text-sm text-gray-500 flex items-center justify-center gap-2 mb-2">
                                <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Verificando pagamento...
                            </div>
                        )}

                        {isDesktop ? (<><Image
                            src={dataQR.charge.qrCodeImage || "/placeholder.svg"}
                            width={300}
                            height={200}
                            alt="QR-CODE"
                        />
                            <div className="border rounded-md p-4 w-full overflow-x-auto">
                                {dataQR.charge.brCode}
                            </div>
                            <Button onClick={() => { navigator.clipboard.writeText(dataQR.charge.brCode); toast.success("Código pix copiado com sucesso!") }}>Copiar codigo pix</Button></>
                        ) :
                            (<><div className="border rounded-md p-4 w-full overflow-x-auto">
                                {dataQR.charge.brCode}
                            </div>
                                <Button onClick={() => { navigator.clipboard.writeText(dataQR.charge.brCode); toast.success("Código pix copiado com sucesso!") }}>Copiar codigo pix</Button></>)
                        }
                        <div className="w-full grid grid-cols-2 gap-4">
                            <h1>Valor</h1>
                            <Input placeholder="Valor" value={"R$" + (dataQR.charge.value / 100).toFixed(2) || "/"} readOnly />
                            <h1>Nome do produto</h1>
                            <Input placeholder="Comentário" value={dataQR.charge.comment || "/"} readOnly />
                            <h1>Status</h1>
                            <Input placeholder="Status" value={pagamentoConcluido ? "CONCLUÍDO" : dataQR.charge.status || "/"} readOnly />
                            <h1>Expira em:</h1>
                            <Input placeholder="Expira em" value={dataQR.charge.expiresIn / 60 + " Minutos" || "/"} readOnly />
                            <h1>Chave Pix:</h1>
                            <Input placeholder="BR CODE" value={dataQR.charge.brCode + " M" || "/"} readOnly />
                        </div>
                        <Link href={dataQR.charge.paymentLinkUrl || "/"}>
                            <Button className="w-full">
                                Pagar Agora
                            </Button>
                        </Link>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={verificarStatusPagamento}
                            disabled={verificandoPagamento}
                            className="mt-2"
                        >
                            {verificandoPagamento ? "Verificando..." : "Verificar Pagamento"}
                        </Button>
                    </>
                )}
            </div>
        </>
    );

    return isDesktop ? (
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) form.reset();
            }}
        >

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{openQR ? "Dados do pix" : "Informe seus dados"}</DialogTitle>
                    <DialogDescription>
                        {openQR ? "Dados do pix para pagamento" : " Informe seus dados para gerar o pix e te enviar infos sobre o produto"}
                        .
                    </DialogDescription>
                </DialogHeader>
                {openQR ? QRContent : FormContent}
            </DialogContent>
        </Dialog>
    ) : (
        <Drawer
            open={isOpen}
            onOpenChange={(open) => {
                setIsOpen(open);
                if (!open) form.reset();
            }}
        >

            <DrawerContent className="p-4">
                <DrawerHeader>
                    <DrawerTitle>Criar Novo Produto</DrawerTitle>
                    <DrawerDescription>
                        Preencha as informações do novo produto abaixo.
                    </DrawerDescription>
                </DrawerHeader>
                {openQR ? QRContent : FormContent}
                <DrawerFooter className="flex justify-end mt-4">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
};
