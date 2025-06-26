import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectLabel, SelectGroup } from "@/app/components/ui/select";
import type { VendasProps } from "@/app/utils/vendas";
import { createClientSupabaseClient } from "@/lib/supabase/client";
import type { ProdutosProps } from "@/app/utils/produto";
import type { CombosProps } from "@/app/utils/combos";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Label } from "@/app/components/ui/label";
import { Separator } from "@/app/components/ui/separator";
import { Badge } from "@/app/components/ui/badge";
import { ShoppingCart } from "lucide-react";

interface QuickEditVendaModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    venda: VendasProps | null;
    onSave: (data: VendasProps) => void;
    loading?: boolean;
}

export const QuickEditVendaModal = ({ open, onOpenChange, venda, onSave, loading }: QuickEditVendaModalProps) => {
    const [form, setForm] = useState<VendasProps | null>(venda);
    const [products, setProducts] = useState<ProdutosProps[]>([]);
    const [combos, setCombos] = useState<CombosProps[]>([]);

    // Resetar form ao fechar modal
    useEffect(() => {
        if (!open) setForm(venda);
    }, [open, venda]);

    // Buscar produtos e combos ao abrir a modal
    useEffect(() => {
        if (!open) return;
        const fetchData = async () => {
            const supabase = createClientSupabaseClient();
            const { data: produtos, error: errorProdutos } = await supabase.from("produtos").select("*");
            const { data: combosData, error: errorCombos } = await supabase.from("combos").select("*");
            if (!errorProdutos && produtos) setProducts(produtos);
            if (!errorCombos && combosData) setCombos(combosData);
        };
        fetchData();
    }, [open]);

    // Atualiza o form local quando a venda muda
    if (venda && (!form || form.uuid !== venda.uuid)) setForm(venda);

    // Preenche detalhes do produto/combo ao selecionar
    const handleSelectProduct = (id: string) => {
        setForm((prev) => {
            if (!prev) return prev;
            const selectedProduct = products.find((p) => p.id === id);
            if (selectedProduct) {
                return {
                    ...prev,
                    id_produto: id,
                    tipo_produto: "produto",
                    detalhes_produto: {
                        id: selectedProduct.id || "",
                        nome: selectedProduct.nome || "",
                        valor: selectedProduct.valor || 0,
                        tipo: "produto",
                    },
                };
            }
            const selectedCombo = combos.find((c) => c.id === id);
            if (selectedCombo) {
                return {
                    ...prev,
                    id_produto: id,
                    tipo_produto: "combo",
                    detalhes_produto: {
                        id: selectedCombo.id || "",
                        nome: selectedCombo.nome || "",
                        valor: selectedCombo.valor || 0,
                        tipo: "combo",
                    },
                };
            }
            return { ...prev, id_produto: id };
        });
    };

    if (!form) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg w-full p-0 bg-transparent border-none shadow-none">
                <Card className="w-full max-w-lg mx-auto shadow-xl border-0">
                    <CardHeader className="flex flex-col items-center gap-2 pb-2">
                        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
                            <ShoppingCart className="w-7 h-7 text-primary" />
                        </div>
                        <CardTitle className="text-xl">Editar Venda</CardTitle>
                        <CardDescription>Altere os dados necessários e salve.</CardDescription>
                    </CardHeader>
                    <Separator className="mb-2" />
                    <CardContent className="p-4 sm:p-6">
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="id_cliente">ID do Cliente</Label>
                                <Input
                                    id="id_cliente"
                                    placeholder="ID do Cliente"
                                    value={form.id_cliente}
                                    onChange={e => setForm({ ...form, id_cliente: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="nome_cliente">Nome do Cliente</Label>
                                <Input
                                    id="nome_cliente"
                                    placeholder="Nome do Cliente"
                                    value={form.nome_cliente || ""}
                                    onChange={e => setForm({ ...form, nome_cliente: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="valor">Valor</Label>
                                <Input
                                    id="valor"
                                    placeholder="Valor"
                                    type="number"
                                    value={form.valor}
                                    onChange={e => setForm({ ...form, valor: Number(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="status">Status</Label>
                                <Select value={form.status} onValueChange={status => setForm({ ...form, status })}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="concluida">Concluída</SelectItem>
                                        <SelectItem value="pendente">Pendente</SelectItem>
                                        <SelectItem value="cancelado">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="mt-1">
                                    <Badge variant={form.status === "concluida" ? "secondary" : form.status === "pendente" ? "secondary" : "destructive"}>
                                        {form.status === "concluida" ? "Concluída" : form.status === "pendente" ? "Pendente" : form.status === "cancelado" ? "Cancelada" : ""}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="tipo_pagamento">Forma de Pagamento</Label>
                                <Input
                                    id="tipo_pagamento"
                                    placeholder="Forma de Pagamento"
                                    value={form.tipo_pagamento || ""}
                                    onChange={e => setForm({ ...form, tipo_pagamento: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="tipo_produto">Tipo de Produto</Label>
                                <Select value={form.tipo_produto} onValueChange={tipo_produto => setForm({ ...form, tipo_produto, detalhes_produto: { ...form.detalhes_produto, tipo: tipo_produto } })}>
                                    <SelectTrigger id="tipo_produto">
                                        <SelectValue placeholder="Tipo de Produto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="produto">Produto</SelectItem>
                                        <SelectItem value="combo">Combo</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="mt-1">
                                    <Badge variant={form.tipo_produto === "produto" ? "secondary" : "default"}>
                                        {form.tipo_produto === "produto" ? "Produto" : "Combo"}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            <div className="col-span-full">
                                <Label htmlFor="id_produto">Produto/Combo</Label>
                                <Select value={form.id_produto || ""} onValueChange={handleSelectProduct}>
                                    <SelectTrigger id="id_produto">
                                        <SelectValue placeholder="Selecione o produto/combo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Produtos</SelectLabel>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id!}>
                                                    {product.nome} - {product.categoria} - (ID: {product.id})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <SelectLabel>Combos</SelectLabel>
                                            {combos.map((combo) => (
                                                <SelectItem key={combo.id} value={combo.id!}>
                                                    {combo.nome} - Combo (ID: {combo.id})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="nome_produto">Nome do Produto</Label>
                                <Input
                                    id="nome_produto"
                                    placeholder="Nome do Produto"
                                    value={form.detalhes_produto.nome}
                                    onChange={e => setForm({ ...form, detalhes_produto: { ...form.detalhes_produto, nome: e.target.value } })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="valor_produto">Valor do Produto</Label>
                                <Input
                                    id="valor_produto"
                                    placeholder="Valor do Produto"
                                    type="number"
                                    value={form.detalhes_produto.valor}
                                    onChange={e => setForm({ ...form, detalhes_produto: { ...form.detalhes_produto, valor: Number(e.target.value) } })}
                                />
                            </div>
                            <div>
                                <Label htmlFor="tipo_produto_detalhe">Tipo do Produto</Label>
                                <Select value={form.detalhes_produto.tipo} onValueChange={tipo => setForm({ ...form, detalhes_produto: { ...form.detalhes_produto, tipo } })}>
                                    <SelectTrigger id="tipo_produto_detalhe">
                                        <SelectValue placeholder="Tipo do Produto" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="produto">Produto</SelectItem>
                                        <SelectItem value="combo">Combo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <Separator className="mb-2" />
                    <DialogFooter className="px-4 pb-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancelar</Button>
                        <Button onClick={async () => { if (form) await onSave(form); }} disabled={loading} className="w-full sm:w-auto">
                            {loading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </Card>
            </DialogContent>
        </Dialog>
    );
}; 