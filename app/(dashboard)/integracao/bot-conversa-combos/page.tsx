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
    Package,
} from "lucide-react"
import { createClientSupabaseClient } from "@/lib/supabase/client";
import { CombosProps } from "@/app/utils/combos"

// Types
type BotItem = {
    id: string
    nome_combo: string
    id_combo_vinculado: string | null
}

export default function BotCombosClient() {
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(true)
    const [botItems, setBotItems] = useState<BotItem[]>([])
    const [combos, setCombos] = useState<CombosProps[]>([])
    const [filteredBotItems, setFilteredBotItems] = useState<BotItem[]>([])
    const [filteredCombos, setFilteredCombos] = useState<CombosProps[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [comboSearchTerm, setComboSearchTerm] = useState("")
    const [filterStatus, setFilterStatus] = useState<"all" | "linked" | "unlinked">("all")
    const [selectedBotItem, setSelectedBotItem] = useState<BotItem | null>(null)
    const [selectedComboId, setSelectedComboId] = useState<string>("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)

    const supabase = createClientSupabaseClient()

    // Carregar dados inicialmente
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true)
            try {
                // Buscar itens do bot_conversa
                const { data: bot_conversa, error: botError } = await supabase.from("bot-conversa-combos").select("*")

                if (botError) {
                    throw botError
                }

                setBotItems(bot_conversa || [])

                // Buscar combos
                const { data: combosData, error: combosError } = await supabase.from("combos").select("*")

                if (combosError) {
                    throw combosError
                }

                setCombos(combosData || [])
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
        const botSubscription = supabase.channel(`realtime:public:bot-conversa-combos`).on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "bot-conversa-combos",
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

        // Assinatura para a tabela de combos
        const combosSubscription = supabase.channel(`realtime:public:combos`).on(
            "postgres_changes",
            {
                event: "*",
                schema: "public",
                table: "combos",
            },
            (payload) => {
                setCombos((prevData) => {
                    switch (payload.eventType) {
                        case "INSERT":
                            return [...prevData, payload.new as CombosProps]
                        case "UPDATE":
                            return prevData.map((item) =>
                                item.id === payload.new.id ? (payload.new as CombosProps) : item
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
        combosSubscription.subscribe()

        // Cleanup: desassinar quando o componente for desmontado
        return () => {
            botSubscription.unsubscribe()
            combosSubscription.unsubscribe()
        }
    }, [supabase])

    // Filter items based on search and status
    useEffect(() => {
        let filtered = [...botItems]

        if (searchTerm) {
            filtered = filtered.filter((item) => item.nome_combo.toLowerCase().includes(searchTerm.toLowerCase()))
        }

        if (filterStatus === "linked") {
            filtered = filtered.filter((item) => item.id_combo_vinculado !== null)
        } else if (filterStatus === "unlinked") {
            filtered = filtered.filter((item) => item.id_combo_vinculado === null)
        }

        setFilteredBotItems(filtered)
    }, [searchTerm, filterStatus, botItems])

    // Filtrar combos quando o termo de pesquisa mudar
    useEffect(() => {
        if (!comboSearchTerm.trim()) {
            setFilteredCombos(combos);
            return;
        }

        const searchTermLower = comboSearchTerm.toLowerCase();
        const filtered = combos.filter(
            (combo) =>
                combo.nome.toLowerCase().includes(searchTermLower) ||
                combo.descricao.toLowerCase().includes(searchTermLower)
        );
        setFilteredCombos(filtered);
    }, [comboSearchTerm, combos]);

    // Reset combo search term when dialog closes
    useEffect(() => {
        if (!isDialogOpen) {
            setComboSearchTerm('');
        }
    }, [isDialogOpen]);

    // Get statistics
    const totalItems = botItems.length
    const linkedItems = botItems.filter((p) => p.id_combo_vinculado !== null).length
    const unlinkedItems = totalItems - linkedItems

    // Handle select item for linking
    const handleSelectItemForLink = (item: BotItem) => {
        setSelectedBotItem(item)
        setSelectedComboId(item.id_combo_vinculado || "")
        setIsEditing(!!item.id_combo_vinculado)
        setIsDialogOpen(true)
    }

    // Handle link item
    const handleLinkItem = async () => {
        if (!selectedBotItem) return

        try {
            // Atualizar no Supabase
            const { error } = await supabase
                .from("bot-conversa-combos")
                .update({ id_combo_vinculado: selectedComboId || null })
                .eq("id", selectedBotItem.id)

            if (error) throw error

            // Mostrar toast de sucesso após atualização bem-sucedida
            toast({
                title: isEditing ? "Vínculo atualizado" : "Vínculo criado",
                description: `Item "${selectedBotItem.nome_combo}" foi ${isEditing ? "atualizado" : "vinculado"} com sucesso.`,
                variant: "default",
            })

            // Fechar dialog
            setIsDialogOpen(false)
            setSelectedBotItem(null)
            setSelectedComboId("")
        } catch (error: any) {
            console.error("Erro ao vincular combo:", error)
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
                .from("bot-conversa-combos")
                .update({ id_combo_vinculado: null })
                .eq("id", item.id)

            if (error) throw error

            toast({
                title: "Vínculo removido",
                description: `Item "${item.nome_combo}" foi desvinculado com sucesso.`,
                variant: "default",
            })
        } catch (error: any) {
            console.error("Erro ao desvincular combo:", error)
            toast({
                title: "Erro ao remover vínculo",
                description: "Não foi possível remover o vínculo. Tente novamente.",
                variant: "destructive",
            })
        }
    }

    // Find combo by ID
    const getComboById = (id: string | null) => {
        if (!id) return null
        return combos.find((p) => p.id === id)
    }

    // Atualizar dados
    const handleRefresh = async () => {
        setIsLoading(true)
        try {
            // Buscar itens do bot_conversa
            const { data: bot_conversa, error: botError } = await supabase.from("bot-conversa-combos").select("*")

            if (botError) throw botError
            setBotItems(bot_conversa || [])

            // Buscar combos
            const { data: combosData, error: combosError } = await supabase.from("combos").select("*")

            if (combosError) throw combosError
            setCombos(combosData || [])

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

    // Função para contar produtos em um combo
    const contarProdutosNoCombo = (combo: CombosProps): number => {
        if (!combo.produtos) return 0;

        if (typeof combo.produtos === "string") {
            try {
                const produtosArray = JSON.parse(combo.produtos);
                return Array.isArray(produtosArray) ? produtosArray.length : 0;
            } catch {
                return 0;
            }
        }

        return Array.isArray(combo.produtos) ? combo.produtos.length : 0;
    }

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Itens do Bot Conversa para Combos</CardTitle>
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
                            Nesta página você pode gerenciar os vínculos entre os termos recebidos do bot de conversa e os combos do
                            seu banco de dados. Use o botão <span className="font-medium text-foreground">Criar vínculo</span> para
                            associar um termo a um combo.
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Items Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Itens do Bot Conversa - Combos</CardTitle>
                    <CardDescription>
                        Gerencie os vínculos entre termos recebidos do bot e combos do seu banco de dados
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
                                        setSelectedComboId("")
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
                                        <TableHead>Combo Vinculado</TableHead>
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
                                            const vinculado = getComboById(item.id_combo_vinculado)

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                                                    <TableCell className="font-medium">{item.nome_combo}</TableCell>
                                                    <TableCell>
                                                        {vinculado ? (
                                                            <div>
                                                                <div className="font-medium">{vinculado.nome}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                                                    <span>R$ {vinculado.valor.toFixed(2)}</span>
                                                                    <Badge variant="outline" className="h-5 px-1.5">
                                                                        {contarProdutosNoCombo(vinculado)} produtos
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">Não vinculado</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.id_combo_vinculado ? (
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
                                                                    {item.id_combo_vinculado ? (
                                                                        <Edit className="h-4 w-4 mr-2" />
                                                                    ) : (
                                                                        <PlusCircle className="h-4 w-4 mr-2" />
                                                                    )}
                                                                    {item.id_combo_vinculado ? "Editar vínculo" : "Criar vínculo"}
                                                                </DropdownMenuItem>
                                                                {item.id_combo_vinculado && (
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
                                ? "Atualize o vínculo entre o termo do bot e um combo do banco de dados."
                                : "Vincule o termo do bot a um combo do seu banco de dados."}
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
                                                <p className="font-medium">{selectedBotItem.nome_combo}</p>
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
                                                {item.nome_combo}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-1">
                            <h4 className="text-sm font-medium">Selecione um combo do banco de dados</h4>

                            {/* Campo de pesquisa de combos */}
                            <div className="relative mb-2">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Pesquisar combos..."
                                    className="pl-8"
                                    value={comboSearchTerm}
                                    onChange={(e) => setComboSearchTerm(e.target.value)}
                                />
                            </div>

                            <Select value={selectedComboId} onValueChange={setSelectedComboId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione um combo..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {filteredCombos.map((combo) => (
                                        <SelectItem key={combo.id} value={combo.id || ""}>
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex-1">
                                                    <span>{combo.nome}</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Badge variant="outline" className="h-5 px-1.5 mr-2 flex items-center">
                                                        <Package className="h-3.5 w-3.5 mr-1" />
                                                        {contarProdutosNoCombo(combo)} produtos
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        R$ {combo.valor.toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground mt-1">
                                Escolha o combo do banco de dados que corresponde ao termo do bot.
                            </p>
                        </div>

                        {/* Preview of selected combo */}
                        {selectedComboId && (
                            <div className="space-y-1 mt-4">
                                <h4 className="text-sm font-medium">Combo selecionado</h4>
                                <Card className="bg-primary/5">
                                    <CardContent className="p-3">
                                        {(() => {
                                            const selectedCombo = combos.find((p) => p.id === selectedComboId)
                                            if (!selectedCombo) return null;

                                            const qtdProdutos = contarProdutosNoCombo(selectedCombo);

                                            return (
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-medium">{selectedCombo.nome}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">ID: {selectedCombo.id}</p>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            <Badge variant="outline" className="h-5 px-1.5 flex items-center">
                                                                <Package className="h-3.5 w-3.5 mr-1" />
                                                                {qtdProdutos} produtos
                                                            </Badge>
                                                            <Badge>{selectedCombo.status}</Badge>
                                                        </div>
                                                    </div>
                                                    <div className="text-sm font-medium">R$ {selectedCombo.valor.toFixed(2)}</div>
                                                    {selectedCombo.descricao && (
                                                        <div className="text-xs text-muted-foreground">{selectedCombo.descricao}</div>
                                                    )}
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
                                setSelectedComboId("")
                            }}
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                        <Button onClick={handleLinkItem} disabled={!selectedComboId || !selectedBotItem}>
                            <Check className="h-4 w-4 mr-2" />
                            {isEditing ? "Atualizar vínculo" : "Criar vínculo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
} 
