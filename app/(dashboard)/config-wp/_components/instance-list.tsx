/* eslint-disable @next/next/no-img-element */
"use client"

import { useEffect, useState } from "react"
import { Button } from "@/app/components/ui/button"
import { instanceManager } from "@/app/utils/instance-manager"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/app/components/ui/dialog"
import { Input } from "@/app/components/ui/input"
import { toast } from "sonner"
import { Plus, RefreshCw, Trash2, Power, QrCode, Star, MessageSquare, Users, MessageCircle } from "lucide-react"
import { Badge } from "@/app/components/ui/badge"
import { Skeleton } from "@/app/components/ui/skeleton"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/app/components/ui/alert-dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/app/components/ui/tooltip"
import { motion } from "framer-motion"

interface Instance {
    instanceName: string
    status: string
    number: string | null
    profileName: string
    profilePicUrl: string
    token: string
    lastSeen: string | null
    isOnline: boolean
    isAuthenticated: boolean
    messageCount: number
    contactCount: number
    chatCount: number
    is_default: boolean
}

export const InstanceList = () => {
    const [instances, setInstances] = useState<Instance[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [open, setOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [instanceToDelete, setInstanceToDelete] = useState<string | null>(null)
    const [creatingInstance, setCreatingInstance] = useState(false)
    const [selectedInstance, setSelectedInstance] = useState<string | null>(null)
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [connectingInstance, setConnectingInstance] = useState<string | null>(null)
    const [newInstance, setNewInstance] = useState({
        instanceName: "",
    })
    const [settingDefault, setSettingDefault] = useState<string | null>(null)
    const [expandedToken, setExpandedToken] = useState<string | null>(null)

    const fetchInstances = async () => {
        try {
            setRefreshing(true)
            const response = await fetch("/api/evolution/instances")
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao buscar instâncias")
            }

            // Busca a instância padrão do banco
            const defaultInstance = await instanceManager.getDefaultInstance()

            // Atualiza o estado is_default das instâncias
            const updatedInstances = data.map((instance: Instance) => ({
                ...instance,
                is_default: defaultInstance?.instance_id === instance.instanceName
            }))

            setInstances(updatedInstances)
        } catch (error) {
            console.error("Erro ao buscar instâncias:", error)
            toast.error("Não foi possível carregar as instâncias")
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const createInstance = async () => {
        try {
            setCreatingInstance(true)
            const response = await fetch("/api/evolution/instances/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newInstance),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao criar instância")
            }

            toast.success("Instância criada com sucesso")
            setSelectedInstance(newInstance.instanceName)
            setOpen(false)
            setNewInstance({
                instanceName: "",
            })
            fetchInstances()
        } catch (error) {
            console.error("Erro ao criar instância:", error)
            toast.error(error instanceof Error ? error.message : "Não foi possível criar a instância")
        } finally {
            setCreatingInstance(false)
        }
    }

    const generateQR = async (instanceName: string) => {
        try {
            console.log("Iniciando geração de QR code para:", instanceName);
            const response = await fetch(`/api/evolution/instances/qr?instanceName=${instanceName}`);
            const data = await response.json();

            if (!response.ok) {
                console.error("Erro na resposta:", {
                    status: response.status,
                    data: data
                });
                throw new Error(data.error || data.details?.message || "Erro ao gerar QR code");
            }

            console.log("QR code gerado com sucesso:", data);
            setQrCode(data.base64);
            setSelectedInstance(instanceName);
        } catch (error) {
            console.error("Erro ao gerar QR code:", error);
            toast.error(error instanceof Error ? error.message : "Não foi possível gerar o QR code");
        }
    }

    const connectInstance = async (instanceName: string) => {
        try {
            setConnectingInstance(instanceName)
            const response = await fetch(`/api/evolution/instances/connect`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ instanceName }),
            })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Erro ao conectar instância")
            }

            toast.success("Instância conectada com sucesso")
            setQrCode(null)
            setSelectedInstance(null)
            fetchInstances()
        } catch (error) {
            console.error("Erro ao conectar instância:", error)
            toast.error(error instanceof Error ? error.message : "Não foi possível conectar a instância")
        } finally {
            setConnectingInstance(null)
        }
    }

    const deleteInstance = async (instanceName: string) => {
        try {
            const response = await fetch(`/api/evolution/instances/delete?instanceName=${instanceName}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Erro ao excluir instância");
            }

            toast.success("Instância excluída com sucesso");
            setDeleteDialogOpen(false);
            setInstanceToDelete(null);
            fetchInstances();
        } catch (error) {
            console.error("Erro ao excluir instância:", error);
            toast.error(error instanceof Error ? error.message : "Não foi possível excluir a instância");
        }
    };

    const setDefaultInstance = async (instanceName: string) => {
        try {
            setSettingDefault(instanceName)
            // Encontra a instância selecionada nos dados do Evolution API
            const selectedInstance = instances.find((inst) => inst.instanceName === instanceName)

            if (!selectedInstance) {
                throw new Error("Instância não encontrada")
            }

            // Envia apenas a instância selecionada para o banco
            await instanceManager.setDefaultInstance(selectedInstance.instanceName, selectedInstance.instanceName)

            toast.success("Instância definida como padrão")
            fetchInstances()
        } catch (error) {
            console.error("Erro ao definir instância padrão:", error)
            toast.error("Não foi possível definir a instância como padrão")
        } finally {
            setSettingDefault(null)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        toast.success("Token copiado para a área de transferência")
    }

    const getStatusBadge = (instance: Instance) => {
        if (instance.isOnline) {
            return (
                <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
                    <span className="relative flex h-2 w-2 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Online
                </Badge>
            )
        }
        return <Badge variant="secondary">Desconectado</Badge>
    }

    useEffect(() => {
        fetchInstances()
    }, [])

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 100,
            },
        },
    }

    return (
        <Card className="border border-border/40 bg-background/60 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Instâncias do WhatsApp</CardTitle>
                        <CardDescription>
                            Gerencie suas instâncias do Evolution API
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={fetchInstances}
                            disabled={refreshing}
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                        </Button>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Nova Instância
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Criar Nova Instância</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="instanceName" className="text-sm font-medium">Nome da Instância</label>
                                        <Input
                                            id="instanceName"
                                            value={newInstance.instanceName}
                                            onChange={(e) =>
                                                setNewInstance({ instanceName: e.target.value })
                                            }
                                            placeholder="Digite o nome da instância"
                                            className="border-border/40"
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90"
                                        onClick={createInstance}
                                        disabled={!newInstance.instanceName || creatingInstance}
                                    >
                                        {creatingInstance ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            "Criar Instância"
                                        )}
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="border border-border/40 bg-background/60 backdrop-blur-sm">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-6 w-32" />
                                    <Skeleton className="h-4 w-24 mt-2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-[200px] w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : instances.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                            <MessageSquare className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhuma instância encontrada</h3>
                        <p className="mt-2">Crie uma nova instância para começar a usar o WhatsApp API.</p>
                        <Button
                            onClick={() => setOpen(true)}
                            className="mt-4 bg-primary hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Instância
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {instances.map((instance) => (
                            <motion.div key={instance.instanceName} variants={itemVariants}>
                                <Card className={`h-full flex flex-col transition-all duration-300 hover:shadow-md ${instance.is_default ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-background/60'
                                    } backdrop-blur-sm`}>
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                {instance.profilePicUrl ? (
                                                    <div className="relative">
                                                        <img
                                                            src={instance.profilePicUrl || "/placeholder.svg"}
                                                            alt={instance.profileName}
                                                            className="w-10 h-10 rounded-full object-cover border-2 border-background"
                                                        />
                                                        {instance.isOnline && (
                                                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background"></span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                                                    </div>
                                                )}
                                                <div>
                                                    <CardTitle className="text-lg">{instance.profileName || instance.instanceName}</CardTitle>
                                                    <CardDescription>{instance.instanceName}</CardDescription>
                                                </div>
                                            </div>
                                            <TooltipProvider>
                                                <div className="flex gap-1">
                                                    {instance.isOnline ? (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-green-500 h-8 w-8"
                                                                >
                                                                    <Power className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Conectado</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    ) : (
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => generateQR(instance.instanceName)}
                                                                    className="h-8 w-8"
                                                                >
                                                                    <QrCode className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>Gerar QR Code</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    )}
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => setDefaultInstance(instance.instanceName)}
                                                                disabled={settingDefault === instance.instanceName}
                                                                className={`h-8 w-8 ${instance.is_default ? "text-yellow-500" : ""}`}
                                                            >
                                                                <Star className="h-4 w-4" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>{instance.is_default ? "Instância Padrão" : "Definir como Padrão"}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    setInstanceToDelete(instance.instanceName);
                                                                    setDeleteDialogOpen(true);
                                                                }}
                                                                className="h-8 w-8"
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p>Excluir Instância</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </div>
                                            </TooltipProvider>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(instance)}
                                            {instance.number && <span className="text-sm text-muted-foreground">• {instance.number}</span>}
                                            {instance.is_default && (
                                                <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                                                    <Star className="h-3 w-3 mr-1" />
                                                    Padrão
                                                </Badge>
                                            )}
                                        </div>
                                        {instance.lastSeen && (
                                            <CardDescription className="text-xs mt-1">
                                                Última atualização: {instance.lastSeen}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <div className="grid grid-cols-3 gap-2 text-sm">
                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <MessageSquare className="h-4 w-4 mb-1 text-muted-foreground" />
                                                    <div className="font-medium">{instance.messageCount}</div>
                                                    <div className="text-xs text-muted-foreground">Mensagens</div>
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <Users className="h-4 w-4 mb-1 text-muted-foreground" />
                                                    <div className="font-medium">{instance.contactCount}</div>
                                                    <div className="text-xs text-muted-foreground">Contatos</div>
                                                </div>
                                            </div>
                                            <div className="bg-muted/50 rounded-lg p-3 text-center">
                                                <div className="flex flex-col items-center">
                                                    <MessageCircle className="h-4 w-4 mb-1 text-muted-foreground" />
                                                    <div className="font-medium">{instance.chatCount}</div>
                                                    <div className="text-xs text-muted-foreground">Chats</div>
                                                </div>
                                            </div>
                                        </div>
                                        {instance.token && (
                                            <div className="mt-4 text-sm">
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-medium">Token:</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 px-2 text-xs"
                                                        onClick={() => copyToClipboard(instance.token)}
                                                    >
                                                        Copiar
                                                    </Button>
                                                </div>
                                                <div
                                                    className="bg-muted p-2 rounded text-xs font-mono overflow-hidden"
                                                    onClick={() => setExpandedToken(expandedToken === instance.instanceName ? null : instance.instanceName)}
                                                >
                                                    <code className={`block overflow-x-auto ${expandedToken === instance.instanceName ? '' : 'truncate'}`}>
                                                        {instance.token}
                                                    </code>
                                                </div>
                                            </div>
                                        )}
                                        {selectedInstance === instance.instanceName && qrCode && (
                                            <div className="mt-4 bg-white p-4 rounded-lg">
                                                <div className="font-medium mb-2 text-center">QR Code para conexão</div>
                                                <div className="flex justify-center">
                                                    <img
                                                        src={qrCode || "/placeholder.svg"}
                                                        alt="QR Code"
                                                        className="w-48 h-48 mx-auto"
                                                    />
                                                </div>
                                                <div className="text-xs text-center text-muted-foreground mt-2">
                                                    Escaneie este código com seu WhatsApp
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                    {selectedInstance === instance.instanceName && qrCode && (
                                        <CardFooter className="flex gap-2 pt-0">
                                            <Button
                                                className="flex-1 bg-primary hover:bg-primary/90"
                                                onClick={() => connectInstance(instance.instanceName)}
                                                disabled={connectingInstance === instance.instanceName}
                                            >
                                                {connectingInstance === instance.instanceName ? (
                                                    <>
                                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                        Verificando...
                                                    </>
                                                ) : (
                                                    "Já Conectei"
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => generateQR(instance.instanceName)}
                                            >
                                                <QrCode className="h-4 w-4 mr-2" />
                                                Gerar Novo QR
                                            </Button>
                                        </CardFooter>
                                    )}
                                </Card>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </CardContent>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a instância{" "}
                            <span className="font-semibold">{instanceToDelete}</span>? Esta ação
                            não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => instanceToDelete && deleteInstance(instanceToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
