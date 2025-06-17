"use client";

import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { ProdutosProps } from "@/app/utils/produto";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/components/ui/form";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/app/components/ui/select";
import { Plus, Loader2, Search } from "lucide-react";

const vendaSchema = z.object({
    nome_cliente: z.string().min(1, "Nome do cliente é obrigatório"),
    id_cliente: z.string().min(1, "ID do cliente é obrigatório"),
    valor: z.string().min(1, "Valor é obrigatório").refine((val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num > 0;
    }, "Valor deve ser um número positivo"),
    tipo_pagamento: z.string().min(1, "Tipo de pagamento é obrigatório"),
    tipo_produto: z.string().min(1, "Tipo de produto é obrigatório"),
    categoria: z.string().optional(),
    nome_produto: z.string().min(1, "Nome do produto é obrigatório"),
    id_produto: z.string().min(1, "ID do produto é obrigatório"),
});

type VendaFormData = z.infer<typeof vendaSchema>;

interface VendaManualProps {
    onVendaCriada?: () => void;
}

const fetchProducts = async (): Promise<ProdutosProps[]> => {
    const supabase = createClientSupabaseClient();
    try {
        const { data, error } = await supabase.from("produtos").select("*");

        if (error) {
            console.error("Erro ao carregar produtos:", error);
            return [];
        }

        return data || [];
    } catch (error) {
        console.error("Erro na requisição:", error);
        return [];
    }
};

export const VendaManual = ({ onVendaCriada }: VendaManualProps) => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<ProdutosProps[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const supabase = createClientSupabaseClient();

    const form = useForm<VendaFormData>({
        resolver: zodResolver(vendaSchema),
        defaultValues: {
            nome_cliente: "",
            id_cliente: "",
            valor: "",
            tipo_pagamento: "",
            tipo_produto: "",
            categoria: "",
            nome_produto: "",
            id_produto: "",
        },
    });

    // Carregar produtos quando o modal abrir
    useEffect(() => {
        if (open) {
            loadProducts();
        }
    }, [open]);

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
        } catch (error) {
            console.error("Erro ao carregar produtos:", error);
            toast.error("Erro ao carregar produtos. Tente novamente.");
        } finally {
            setLoadingProducts(false);
        }
    };

    // Filtrar produtos baseado no termo de busca
    const filteredProducts = products.filter(product =>
        product.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Função para preencher automaticamente os campos quando um produto for selecionado
    const handleProductSelect = (productId: string) => {
        const selectedProduct = products.find(p => p.id === productId);

        if (selectedProduct) {
            // Limpar campos relacionados ao produto antes de preencher
            form.setValue("id_produto", "");
            form.setValue("nome_produto", "");
            form.setValue("valor", "");
            form.setValue("tipo_produto", "");
            form.setValue("categoria", "");

            // Preencher com os dados do produto selecionado
            form.setValue("id_produto", selectedProduct.id || "");
            form.setValue("nome_produto", selectedProduct.nome || "");
            form.setValue("valor", selectedProduct.valor?.toString() || "");
            form.setValue("tipo_produto", selectedProduct.tipo || "produto");
            form.setValue("categoria", selectedProduct.categoria || "");

            toast.success(`Produto "${selectedProduct.nome}" selecionado!`);
        }
    };

    // Função para limpar a busca e seleção de produto
    const clearProductSelection = () => {
        setSearchTerm("");
        form.setValue("id_produto", "");
        form.setValue("nome_produto", "");
        form.setValue("valor", "");
        form.setValue("tipo_produto", "");
        form.setValue("categoria", "");
        toast.info("Seleção de produto limpa");
    };

    const onSubmit = async (data: VendaFormData) => {
        setLoading(true);
        try {
            console.log("Dados do formulário:", data);

            const vendaData = {
                uuid: uuidv4(),
                id_transacao: uuidv4(),
                origin: "manual",
                nome_cliente: data.nome_cliente,
                id_cliente: data.id_cliente,
                valor: parseFloat(data.valor),
                tipo_pagamento: data.tipo_pagamento,
                tipo_produto: data.tipo_produto,
                categoria: data.categoria || "",
                status: "concluida",
                created_at: new Date().toISOString(),
                detalhes_produto: {
                    id: data.id_produto,
                    nome: data.nome_produto,
                    valor: parseFloat(data.valor),
                    tipo: data.tipo_produto,
                },
            };

            console.log("Dados da venda a serem inseridos:", vendaData);

            const { data: insertedData, error } = await supabase.from("vendas").insert([vendaData]).select();

            console.log("Resposta do Supabase:", { insertedData, error });

            if (error) {
                console.error("Erro detalhado:", error);
                throw error;
            }

            toast.success("Venda registrada com sucesso!");
            form.reset();
            setOpen(false);
            onVendaCriada?.();
        } catch (error) {
            console.error("Erro ao registrar venda:", error);
            toast.error(`Erro ao registrar venda: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Registrar Venda Manual
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Registrar Venda Manual</DialogTitle>
                    <DialogDescription>
                        Preencha os dados para registrar uma nova venda manualmente.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Seletor de Produto */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <FormLabel>Selecionar Produto (Opcional)</FormLabel>
                            </div>

                            {!form.watch("id_produto") ? (
                                <>
                                    {/* Campo de busca */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Buscar por nome, ID ou categoria..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>

                                    <Select
                                        onValueChange={handleProductSelect}
                                        disabled={loadingProducts}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={
                                                    loadingProducts
                                                        ? "Carregando produtos..."
                                                        : searchTerm
                                                            ? `Produtos encontrados: ${filteredProducts.length}`
                                                            : "Selecione um produto para preenchimento automático"
                                                } />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {filteredProducts.length > 0 ? (
                                                filteredProducts.map((product) => (
                                                    <SelectItem key={product.id} value={product.id!}>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{product.nome}</span>
                                                            <span className="text-sm text-muted-foreground">
                                                                R$ {product.valor?.toFixed(2)} - {product.categoria}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                ID: {product.id}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))
                                            ) : searchTerm ? (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    Nenhum produto encontrado para &quot;{searchTerm}&quot;
                                                </div>
                                            ) : (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    Nenhum produto disponível
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>

                                    {searchTerm && (
                                        <p className="text-xs text-muted-foreground">
                                            Mostrando {filteredProducts.length} de {products.length} produtos
                                        </p>
                                    )}
                                </>
                            ) : null}

                            {/* Informações do produto selecionado */}
                            {form.watch("id_produto") && (
                                <div className="p-3 bg-muted/50 rounded-lg border">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium text-sm">
                                                Produto Selecionado: {form.watch("nome_produto")}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                ID: {form.watch("id_produto")} |
                                                Categoria: {form.watch("categoria")} |
                                                Tipo: {form.watch("tipo_produto")}
                                            </p>
                                            <p className="text-sm font-semibold text-primary">
                                                Valor: R$ {parseFloat(form.watch("valor")).toFixed(2)}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearProductSelection}
                                            className="h-6 w-6 p-0"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nome_cliente"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Cliente</FormLabel>
                                        <FormControl>
                                            <Input placeholder="João Silva" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="id_cliente"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID do Cliente</FormLabel>
                                        <FormControl>
                                            <Input placeholder="cliente_123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="valor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Valor (R$)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="99.90"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tipo_pagamento"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Pagamento</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="pix">PIX</SelectItem>
                                                <SelectItem value="cartao">Cartão</SelectItem>
                                                <SelectItem value="dinheiro">Dinheiro</SelectItem>
                                                <SelectItem value="transferencia">Transferência</SelectItem>
                                                <SelectItem value="outros">Outros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="tipo_produto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tipo de Produto</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="recarga">Recarga</SelectItem>
                                                <SelectItem value="produto">Produto</SelectItem>
                                                <SelectItem value="servico">Serviço</SelectItem>
                                                <SelectItem value="combo">Combo</SelectItem>
                                                <SelectItem value="outros">Outros</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="categoria"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoria (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Categoria" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="nome_produto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nome do Produto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Recarga de R$ 50" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="id_produto"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ID do Produto</FormLabel>
                                        <FormControl>
                                            <Input placeholder="produto_123" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Registrando...
                                    </>
                                ) : (
                                    "Registrar Venda"
                                )}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}; 