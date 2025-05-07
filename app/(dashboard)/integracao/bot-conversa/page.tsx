"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/app/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
    Search,
    MoreHorizontal,
    RefreshCw,
    Check,
    X,
    AlertCircle,
    PlusCircle,
    Trash2,
    Edit,
    FileText,
    Bot,
    CalendarIcon,
    RepeatIcon,
} from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { ProdutosProps } from "@/app/utils/produto"

// Types
type BotItem = {
    id: string
    nome: string
    id_produto_vinculado: string | null
}


export default function BotProdutosClient() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [botItems, setBotItems] = useState<BotItem[]>([])
    const [produtos, setProdutos] = useState<ProdutosProps[]>([])
    const [filteredBotItems, setFilteredBotItems] = useState<BotItem[]>([])
    const [filteredProdutos, setFilteredProdutos] = useState<ProdutosProps[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [produtoSearchTerm, setProdutoSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all")
    const [selectedBotItem, setSelectedBotItem] = useState<BotItem | null>(null)
    const [selectedProdutoId, setSelectedProdutoId] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const supabase = createClientSupabaseClient()

    // Carregar dados inicialmente
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // Buscar itens do bot_conversa
                const { data: bot_conversa, error: botError } = await supabase.from("bot-conversa").select("*")

                if (botError) {
                    throw botError
                }

                setBotItems(bot_conversa || [])

                // Buscar produtos
                const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*")

                if (produtosError) {
                    throw produtosError
                }

                setProdutos(produtosData || [])
            } catch (error: any) {
                console.error("Erro ao carregar dados:", error)
                toast({
                    title: "Erro ao carregar dados",
                    description: "Não foi possível carregar os dados. Tente novamente.",
                    variant: "destructive",
                })
            } finally {
                setIsLoading(false)
            }
        }

        loadData()
    }, [supabase, toast])

    // Assinatura em tempo real para atualizar dados conforme alterações no banco
    useEffect(() => {
        const botSubscription = supabase.channel(`realtime:public:bot-conversa`).on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "bot-conversa",
            },
            (payload) => {
                setBotItems((prevData) => {
                    switch (payload.eventType) {
                        case "INSERT":
                            return [...prevData, payload.new as BotItem]
                        case "UPDATE":
                            return prevData.map((item) =>
                                item.id === payload.new.id ? (payload.new as BotItem) : item
                            )
                        case "DELETE":
                            return prevData.filter((item) => item.id !== payload.old.id)
                        default:
                            return prevData
                    }
                })
            },
        )

        // Assinatura para a tabela de produtos
        const produtosSubscription = supabase.channel(`realtime:public:produtos`).on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "produtos",
            },
            (payload) => {
                setProdutos((prevData) => {
                    switch (payload.eventType) {
                        case "INSERT":
                            return [...prevData, payload.new as ProdutosProps]
                        case "UPDATE":
                            return prevData.map((item) =>
                                item.id === payload.new.id ? (payload.new as ProdutosProps) : item
                            )
                        case "DELETE":
                            return prevData.filter((item) => item.id !== payload.old.id)
                        default:
                            return prevData
                    }
                })
            },
        )

        botSubscription.subscribe()
        produtosSubscription.subscribe()

        // Cleanup: desassinar quando o componente for desmontado
        return () => {
            botSubscription.unsubscribe()
            produtosSubscription.unsubscribe()
        }
    }, [supabase])

    // Filter items based on search and status
    useEffect(() => {
        let filtered = [...botItems]

        if (searchTerm) {
            filtered = filtered.filter((item) => item.nome.toLowerCase().includes(searchTerm.toLowerCase()))
        }

        if (filterStatus === "linked") {
            filtered = filtered.filter((item) => item.id_produto_vinculado !== null)
        } else if (filterStatus === "unlinked") {
            filtered = filtered.filter((item) => item.id_produto_vinculado === null)
        }

        setFilteredBotItems(filtered)
    }, [searchTerm, filterStatus, botItems])

    // Filtrar produtos quando o termo de pesquisa mudar
    useEffect(() => {
        if (!produtoSearchTerm.trim()) {
            setFilteredProdutos(produtos);
            return;
        }

        const searchTermLower = produtoSearchTerm.toLowerCase();
        const filtered = produtos.filter(
            (produto) =>
                produto.nome.toLowerCase().includes(searchTermLower) ||
                produto.categoria.toLowerCase().includes(searchTermLower)
        );
        setFilteredProdutos(filtered);
    }, [produtoSearchTerm, produtos]);

    // Reset produto search term when dialog closes
    useEffect(() => {
        if (!isDialogOpen) {
            setProdutoSearchTerm('');
        }
    }, [isDialogOpen]);

    // Get statistics
    const totalItems = botItems.length
    const linkedItems = botItems.filter((p) => p.id_produto_vinculado !== null).length
    const unlinkedItems = totalItems - linkedItems

    // Handle select item for linking
    const handleSelectItemForLink = (item: BotItem) => {
        setSelectedBotItem(item)
        setSelectedProdutoId(item.id_produto_vinculado || "")
        setIsEditing(!!item.id_produto_vinculado)
        setIsDialogOpen(true)
    }

    // Handle link item
    const handleLinkItem = async () => {
        if (!selectedBotItem) return

        try {
            // Atualizar no Supabase
            const { error } = await supabase
                .from("bot-conversa")
                .update({ id_produto_vinculado: selectedProdutoId || null })
                .eq("id", selectedBotItem.id)

            if (error) throw error

            // Mostrar toast de sucesso após atualização bem-sucedida
            toast({
                title: isEditing ? "Vínculo atualizado" : "Vínculo criado",
                description: `Item "${selectedBotItem.nome}" foi ${isEditing ? "atualizado" : "vinculado"} com sucesso.`,
                variant: "default",
            })

            // Fechar dialog
            setIsDialogOpen(false)
            setSelectedBotItem(null)
            setSelectedProdutoId("")
        } catch (error: any) {
            console.error("Erro ao vincular produto:", error)
            toast({
                title: "Erro ao salvar",
                description: "Não foi possível salvar o vínculo. Tente novamente.",
                variant: "destructive",
            })
        }
    }

    // Handle unlink item
    const handleUnlinkItem = async (item: BotItem) => {
        try {
            const { error } = await supabase
                .from("bot-conversa")
                .update({ id_produto_vinculado: null })
                .eq("id", item.id)

            if (error) throw error

            toast({
                title: "Vínculo removido",
                description: `Item "${item.nome}" foi desvinculado com sucesso.`,
                variant: "default",
            })
        } catch (error: any) {
            console.error("Erro ao desvincular produto:", error)
            toast({
                title: "Erro ao remover vínculo",
                description: "Não foi possível remover o vínculo. Tente novamente.",
                variant: "destructive",
            })
        }
    }

    // Find product by ID
    const getProdutoById = (id: string | null) => {
        if (!id) return null
        return produtos.find((p) => p.id === id)
    }

    // Atualizar dados
    const handleRefresh = async () => {
        setIsLoading(true)
        try {
            // Buscar itens do bot_conversa
            const { data: bot_conversa, error: botError } = await supabase.from("bot-conversa").select("*")

            if (botError) throw botError
            setBotItems(bot_conversa || [])

            // Buscar produtos
            const { data: produtosData, error: produtosError } = await supabase.from("produtos").select("*")

            if (produtosError) throw produtosError
            setProdutos(produtosData || [])

            toast({
                title: "Dados atualizados",
                description: "Lista de itens atualizada com sucesso.",
                variant: "default",
            })
        } catch (error: any) {
            console.error("Erro ao atualizar dados:", error)
            toast({
                title: "Erro ao atualizar dados",
                description: "Não foi possível atualizar os dados. Tente novamente.",
                variant: "destructive",
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Função para determinar se um produto é mensal ou anual com base na categoria
    const getTipoProduto = (categoria: string): string => {
        const categoriaNormalizada = categoria.toLowerCase();

        if (
            categoriaNormalizada.includes("mensal") ||
            categoriaNormalizada.includes("mes") ||
            categoriaNormalizada.includes("month") ||
            categoriaNormalizada === "1"
        ) {
            return "Mensal";
        } else if (
            categoriaNormalizada.includes("anual") ||
            categoriaNormalizada.includes("ano") ||
            categoriaNormalizada.includes("year") ||
            categoriaNormalizada === "12"
        ) {
            return "Anual";
        }

        return "Outros";
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens do Bot Conversa</CardTitle>
                        <Bot className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{isLoading ? <Skeleton className="h-8 w-20" /> : totalItems}</div>
                        <div className="flex items-center mt-1 text-sm">
                            <div className="flex items-center mr-4">
                                <Badge
                                    variant="outline"
                                    className="mr-1 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                                >
                                    <Check className="h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
                                    <span className="text-green-700 dark:text-green-400">{linkedItems}</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">Vinculados</span>
                            </div>
                            <div className="flex items-center">
                                <Badge
                                    variant="outline"
                                    className="mr-1 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                                >
                                    <AlertCircle className="h-3 w-3 mr-1 text-yellow-600 dark:text-yellow-400" />
                                    <span className="text-yellow-700 dark:text-yellow-400">{unlinkedItems}</span>
                                </Badge>
                                <span className="text-xs text-muted-foreground">Pendentes</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Instruções</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Nesta página você pode gerenciar os vínculos entre os termos recebidos do bot de conversa e os produtos do
                            seu banco de dados. Use o botão <span className="font-medium text-foreground">Criar vínculo</span> para
                            associar um termo a um produto.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Itens do Bot Conversa</CardTitle>
                    <CardDescription>
                        Gerencie os vínculos entre termos recebidos do bot e produtos do seu banco de dados
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Search and Filters */}
                        <div className="flex flex-col gap-4 sm:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por nome..."
                                    className="pl-8"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select
                                    value={filterStatus}
                                    onValueChange={(value) => setFilterStatus(value as "all" | "linked" | "unlinked")}
                                >
                                    <SelectTrigger className="w-full sm:w-[180px]">
                                        <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos os itens</SelectItem>
                                        <SelectItem value="linked">Vinculados</SelectItem>
                                        <SelectItem value="unlinked">Não vinculados</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedBotItem(null)
                                        setSelectedProdutoId("")
                                        setIsEditing(false)
                                        setIsDialogOpen(true)
                                    }}
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Criar vínculo
                                </Button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="rounded-md border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">ID</TableHead>
                                        <TableHead className="w-[150px]">Nome</TableHead>
                                        <TableHead>Produto Vinculado</TableHead>
                                        <TableHead className="w-[100px]">Status</TableHead>
                                        <TableHead className="w-[100px] text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        // Loading skeletons
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={`loading-${i}`}>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-[60px]" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-[80px]" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-5 w-[200px]" />
                                                </TableCell>
                                                <TableCell>
                                                    <Skeleton className="h-6 w-[70px]" />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Skeleton className="h-9 w-9 ml-auto" />
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredBotItems.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <AlertCircle className="h-8 w-8 mb-2" />
                                                    <p>Nenhum item encontrado</p>
                                                    <p className="text-sm">Tente ajustar seus filtros de busca</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        // Actual data
                                        filteredBotItems.map((item) => {
                                            const vinculado = getProdutoById(item.id_produto_vinculado)

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell className="font-medium">{item.nome}</TableCell>
                                                    <TableCell>
                                                        {vinculado ? (
                                                            <div>
                                                                <div className="font-medium">{vinculado.nome}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                                    <span>R$ {vinculado.valor.toFixed(2)}</span>
                                                                    <Badge variant="outline" className="h-5 px-1.5">
                                                                        {vinculado.categoria}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Não vinculado</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.id_produto_vinculado ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800"
                                                            >
                                                                <Check className="h-3 w-3 mr-1" />
                                                                Vinculado
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800"
                                                            >
                                                                <AlertCircle className="h-3 w-3 mr-1" />
                                                                Pendente
                                                            </Badge>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                    <span className="sr-only">Abrir menu</span>
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => handleSelectItemForLink(item)}>
                                                                    {item.id_produto_vinculado ? (
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                    ) : (
                                                                        <PlusCircle className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    {item.id_produto_vinculado ? "Editar vínculo" : "Criar vínculo"}
                                                                </DropdownMenuItem>
                                                                {item.id_produto_vinculado && (
                                                                    <DropdownMenuItem onClick={() => handleUnlinkItem(item)}>
                                                                        <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                                                                        <span className="text-destructive">Remover vínculo</span>
                                                                    </DropdownMenuItem>
                                                                )}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            )
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                    </Button>
                    <div className="text-xs text-muted-foreground">
                        Exibindo {filteredBotItems.length} de {totalItems} itens
                    </div>
                </CardFooter>
            </Card>

            {/* Link Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar vínculo" : "Criar vínculo"}</DialogTitle>
                        <DialogDescription>
                            {isEditing
                                ? "Atualize o vínculo entre o termo do bot e um produto do banco de dados."
                                : "Vincule o termo do bot a um produto do seu banco de dados."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {selectedBotItem ? (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">Termo do Bot</h4>
                                <Card className="bg-secondary/50">
                                    <CardContent className="p-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{selectedBotItem.nome}</p>
                                                <p className="text-xs text-muted-foreground mt-1">ID: {selectedBotItem.id}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <h4 className="text-sm font-medium">Selecione um termo do bot</h4>
                                <Select onValueChange={(value) => {
                                    const item = botItems.find(i => i.id === value);
                                    if (item) setSelectedBotItem(item);
                                }}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um termo do bot..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {botItems.map((item) => (
                                            <SelectItem key={item.id} value={item.id}>
                                                {item.nome}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium">Selecione um produto do banco de dados</h4>

                            {/* Campo de pesquisa de produtos */}
                            <div className="relative mb-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar produtos..."
                                    className="pl-8"
                                    value={produtoSearchTerm}
                                    onChange={(e) => setProdutoSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={selectedProdutoId} onValueChange={setSelectedProdutoId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um produto..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {filteredProdutos.map((produto) => {
                                        const tipoProduto = getTipoProduto(produto.categoria);
                                        const iconComponent = tipoProduto === "Mensal" ?
                                            <RepeatIcon className="h-3.5 w-3.5 mr-1" /> :
                                            tipoProduto === "Anual" ?
                                                <CalendarIcon className="h-3.5 w-3.5 mr-1" /> : null;

                                        return (
                                            <SelectItem key={produto.id} value={produto.id || ""}>
                                                <div className="flex justify-between items-center w-full">
                                                    <div className="flex-1">
                                                        <span>{produto.nome}</span>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Badge variant="outline" className="h-5 px-1.5 mr-2 flex items-center">
                                                            {iconComponent}
                                                            {tipoProduto}
                                                        </Badge>
                                                        <span className="text-xs text-muted-foreground">
                                                            R$ {produto.valor.toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Escolha o produto do banco de dados que corresponde ao termo do bot.
                            </p>
                        </div>

                        {/* Preview of selected product */}
                        {selectedProdutoId && (
                            <div className="space-y-1 mt-4">
                                <h4 className="text-sm font-medium">Produto selecionado</h4>
                                <Card className="bg-primary/5">
                                    <CardContent className="p-3">
                                        {(() => {
                                            const selectedProduto = produtos.find((p) => p.id === selectedProdutoId)
                                            if (!selectedProduto) return null;

                                            const tipoProduto = getTipoProduto(selectedProduto.categoria);
                                            const iconComponent = tipoProduto === "Mensal" ?
                                                <RepeatIcon className="h-3.5 w-3.5 mr-1" /> :
                                                tipoProduto === "Anual" ?
                                                    <CalendarIcon className="h-3.5 w-3.5 mr-1" /> : null;

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{selectedProduto.nome}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">ID: {selectedProduto.id}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge variant="outline" className="h-5 px-1.5 flex items-center">
                                                                {iconComponent}
                                                                {tipoProduto}
                                                            </Badge>
                                                            <Badge>{selectedProduto.categoria}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium">R$ {selectedProduto.valor.toFixed(2)}</div>
                                                </div>
                                            )
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsDialogOpen(false)
                                setSelectedBotItem(null)
                                setSelectedProdutoId("")
                            }}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={handleLinkItem} disabled={!selectedProdutoId || !selectedBotItem}>
                            <Check className="h-4 w-4 mr-2" />
                            {isEditing ? "Atualizar vínculo" : "Criar vínculo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}