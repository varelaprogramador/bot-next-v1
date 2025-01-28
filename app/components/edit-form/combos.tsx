import * as React from "react";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/app/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { ProdutosProps } from "@/app/utils/produto";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Edit, Plus, ShoppingBasket, X } from "lucide-react";
import { CombosProps } from "@/app/utils/combos"; // Importando a interface CombosProps
import { v4 as uuidv4 } from 'uuid';

// Função para buscar produtos
const fetchProducts = async () => {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from("produtos").select("*");

        if (error) {
            console.error("Erro ao carregar produto:", error);
            return []; // Retorna um array vazio em caso de erro
        }
        return data || []; // Retorna os dados ou um array vazio
    } catch (error) {
        console.error("Erro na requisição:", error);
        return []; // Retorna um array vazio em caso de erro
    }
};

interface DialogCreateOrUpdateComboProps {
    combo?: CombosProps; // Se fornecido, será um formulário de atualização
    onConfirm: (args: { data: CombosProps }) => void;
}
const produtoSchema = z.object({
    id: z.string().optional(),
    nome: z.string().min(1, "O nome do produto é obrigatório"),
    descricao: z.string().min(1, "A descrição do produto é obrigatória"),
    valor: z.number().min(0, "O valor do produto deve ser maior que zero"),
    categoria: z.string().min(1, "A categoria do produto é obrigatória"),
    created_at: z.string().optional(),
  });
  
const schema = z.object({
    nome: z.string().trim().min(1, "Campo Obrigatório!"),
    descricao: z.string().trim().min(1, "Campo Obrigatório!"),
    status: z.string().trim().min(1, "Campo Obrigatório!"),
    produtos: z.array(produtoSchema).min(1,"Selecione pelo menos um produto"),
    valor: z.preprocess(
        (val) => (typeof val === "string" ? parseFloat(val) : val),
        z.number().min(0, "O preço não pode ser negativo!")
    ),
});

export const CreateOrUpdateCombo = ({
    combo,
    onConfirm,
}: DialogCreateOrUpdateComboProps) => {
    const [open, setOpen] = useState(false);
    const [products, setProducts ] = useState<ProdutosProps[]>([]);
    const [productSelecionados, setProductSelecionados] = useState('');
    const [listProductSelecionados, setListProductSelecionados] = useState<ProdutosProps[]>([]);
    const isDesktop = !useIsMobile();
    
    const form = useForm<z.infer<typeof schema>>({
        resolver: zodResolver(schema),
        defaultValues: {
            nome: "",
            descricao: "",
            status: "",
            produtos: [],
            valor: 0
        },
    });

    useEffect(() => {
        const loadProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
        };
        loadProducts();
    }, []);

    const onSubmit = (values: z.infer<typeof schema>) => {
        console.log(values);
        onConfirm({
            data: {
                ...values,
                id: combo?.id || uuidv4(),
                produtos: listProductSelecionados,
            }
        });
        setOpen(false);
        form.reset();
    };
    useEffect(()=>{
        form.setValue("produtos",listProductSelecionados);
    },[form, listProductSelecionados]);
    const FormContent = (
        <Form {...form}>
            <form
                className="grid items-start gap-4"
                onSubmit={form.handleSubmit((data) => {
                    console.log(data);
                    onSubmit(data); 
                })}
            >
                <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome do Combo</FormLabel>
                            <FormControl>
                                <Input placeholder="Nome do Combo" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="descricao"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Input placeholder="Descrição" {...field} />
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
                                    onValueChange={field.onChange}
                                    value={field.value}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Selecione um status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={"ativo"}>Ativo</SelectItem>
                                        <SelectItem value={"desativado"}>Desativado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                
                <FormLabel>Produtos</FormLabel>
                <div className="flex gap-4">
                    <Select onValueChange={setProductSelecionados}>
                        <SelectTrigger className="w-full max-w-xs">
                            <SelectValue placeholder="Selecione um produto" />
                        </SelectTrigger>
                        <SelectContent>
                            {products.map((product) => (
                                <SelectItem key={product.id} value={product.id!}>
                                    {product.nome} - {product.categoria} - (ID: {product.id})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button onClick={(e) => {
                        e.preventDefault();
                        if (listProductSelecionados.find(produtoV => produtoV.id === productSelecionados)) {
                            window.alert('Dentro deste Combo já existe esse produto, escolha outro.');
                            return;
                        }
                        setListProductSelecionados((prevProducts) => [
                            ...prevProducts,
                            products.find(product => product.id === productSelecionados) as ProdutosProps
                        ]);
                    }}>
                        <Plus />
                    </Button>
                </div>
                <div className="border bg-yellow-50 min-h-[50px] max-h-[130px] overflow-y-auto grid grid-cols-4 p-2 gap-4">
                    {listProductSelecionados.length >= 1 ? (
                        listProductSelecionados.map((item, index) => (
                            <div
                                key={`${item.id}//${index}`}
                                className="bg-blue-600 p-2 text-sm flex justify-between items-center rounded-md text-white"
                            >
                                <p
                                    className="m-0 overflow-hidden whitespace-nowrap text-ellipsis"
                                    style={{ maxWidth: '120px' }}
                                >
                                    {item.nome}
                                </p>
                                <Button
                                    onClick={() => {
                                        setListProductSelecionados((prevProducts) =>
                                            prevProducts.filter((product2) => product2.id !== item.id)
                                        );
                                    }}
                                    className="p-0 bg-blue-600 hover:bg-blue-700 shadow-none"
                                >
                                    <X className="flex-shrink-0" size={12} />
                                </Button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-4 col-span-4">
                            <p>Sem produtos adicionados</p>
                        </div>
                    )}
                </div>
                <FormField
                    control={form.control}
                    name="valor"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="Valor" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button type="submit" onClick={()=>{  console.log(form.getValues())}}>
                     Criar Combo
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
            <div className="border border-dashed p-8 flex justify-center items-center rounded text-gray-200 transition-all duration-300 hover:border-gray-400 hover:text-gray-500">
          <div className="flex flex-col gap-8 justify-center items-center">
            <ShoppingBasket size={80} />
            <p className="font-medium">Criar Combo</p>
          </div>
        </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {combo ? "Atualizar Combo" : "Criar Combo"}
                    </DialogTitle>
                    <DialogDescription>
                        Preencha as informações do combo abaixo.
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
            <div className="border border-dashed p-8 flex justify-center items-center rounded text-gray-200 transition-all duration-300 hover:border-gray-400 hover:text-gray-500">
          <div className="flex flex-col gap-8 justify-center items-center">
            <ShoppingBasket size={80} />
            <p className="font-medium">Criar Combo</p>
          </div>
        </div>
            </DrawerTrigger>
            <DrawerContent className="p-4">
                <DrawerHeader>
                    <DrawerTitle>
                        {combo ? "Atualizar Combo" : "Criar Combo"}
                    </DrawerTitle>
                    <DrawerDescription>
                        Preencha as informações do combo abaixo.
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