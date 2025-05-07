"use client";

import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { contactManager } from "@/app/utils/contact-manager";
import { Contact, CreateContactDTO } from "@/app/types/contact";
import { useUser } from "@clerk/nextjs";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/app/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Search, Tag, User, Phone } from "lucide-react";
import { Badge } from "@/app/components/ui/badge";
import { Skeleton } from "@/app/components/ui/skeleton";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/app/components/ui/alert-dialog";
import { motion } from "framer-motion";

export const ContactList = () => {
    const { user } = useUser();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [contactToDelete, setContactToDelete] = useState<string | null>(null);
    const [creatingContact, setCreatingContact] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [newContact, setNewContact] = useState<CreateContactDTO>({
        name: "",
        whatsapp: "",
        description: "",
        tags: [],
    });

    const fetchContacts = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await contactManager.listContacts(user.id);
            setContacts(data);
        } catch (error) {
            console.error("Erro ao buscar contatos:", error);
            toast.error("Não foi possível carregar os contatos");
        } finally {
            setLoading(false);
        }
    };

    const createContact = async () => {
        if (!user) return;
        try {
            setCreatingContact(true);
            await contactManager.createContact(newContact, user.id);
            toast.success("Contato criado com sucesso");
            setOpen(false);
            setNewContact({
                name: "",
                whatsapp: "",
                description: "",
                tags: [],
            });
            fetchContacts();
        } catch (error) {
            console.error("Erro ao criar contato:", error);
            toast.error(error instanceof Error ? error.message : "Não foi possível criar o contato");
        } finally {
            setCreatingContact(false);
        }
    };

    const deleteContact = async (id: string) => {
        if (!user) return;
        try {
            await contactManager.deleteContact(id, user.id);
            toast.success("Contato excluído com sucesso");
            setDeleteDialogOpen(false);
            setContactToDelete(null);
            fetchContacts();
        } catch (error) {
            console.error("Erro ao excluir contato:", error);
            toast.error("Não foi possível excluir o contato");
        }
    };

    const searchContacts = async (query: string) => {
        if (!user) return;
        try {
            setLoading(true);
            const data = await contactManager.searchContacts(query, user.id);
            setContacts(data);
        } catch (error) {
            console.error("Erro ao buscar contatos:", error);
            toast.error("Não foi possível buscar os contatos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchContacts();
        }
    }, [user]);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
            },
        },
    };

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
    };

    if (!user) {
        return (
            <Card className="border border-border/40 bg-background/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>Contatos</CardTitle>
                    <CardDescription>
                        Faça login para gerenciar seus contatos
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <Card className="border border-border/40 bg-background/60 backdrop-blur-sm">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Contatos</CardTitle>
                        <CardDescription>
                            Gerencie seus contatos para envio de mensagens
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar contatos..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    searchContacts(e.target.value);
                                }}
                                className="pl-8 w-[200px]"
                            />
                        </div>
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="bg-primary hover:bg-primary/90">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Novo Contato
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Criar Novo Contato</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="text-sm font-medium">
                                            Nome
                                        </label>
                                        <Input
                                            id="name"
                                            value={newContact.name}
                                            onChange={(e) =>
                                                setNewContact({ ...newContact, name: e.target.value })
                                            }
                                            placeholder="Digite o nome do contato"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="whatsapp" className="text-sm font-medium">
                                            WhatsApp
                                        </label>
                                        <Input
                                            id="whatsapp"
                                            value={newContact.whatsapp}
                                            onChange={(e) =>
                                                setNewContact({ ...newContact, whatsapp: e.target.value })
                                            }
                                            placeholder="Digite o número do WhatsApp"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="description" className="text-sm font-medium">
                                            Descrição
                                        </label>
                                        <Textarea
                                            id="description"
                                            value={newContact.description}
                                            onChange={(e) =>
                                                setNewContact({ ...newContact, description: e.target.value })
                                            }
                                            placeholder="Digite uma descrição para o contato"
                                        />
                                    </div>
                                    <Button
                                        className="w-full bg-primary hover:bg-primary/90"
                                        onClick={createContact}
                                        disabled={!newContact.name || !newContact.whatsapp || creatingContact}
                                    >
                                        {creatingContact ? (
                                            <>
                                                <Plus className="h-4 w-4 mr-2 animate-spin" />
                                                Criando...
                                            </>
                                        ) : (
                                            "Criar Contato"
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
                                    <Skeleton className="h-[100px] w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : contacts.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <div className="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                            <User className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium">Nenhum contato encontrado</h3>
                        <p className="mt-2">Crie um novo contato para começar a usar o sistema.</p>
                        <Button
                            onClick={() => setOpen(true)}
                            className="mt-4 bg-primary hover:bg-primary/90"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Novo Contato
                        </Button>
                    </div>
                ) : (
                    <motion.div
                        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {contacts.map((contact) => (
                            <motion.div key={contact.id} variants={itemVariants}>
                                <Card className="h-full flex flex-col transition-all duration-300 hover:shadow-md border-border/40 bg-background/60 backdrop-blur-sm">
                                    <CardHeader className="pb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <User className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                                                    <CardDescription className="flex items-center gap-1">
                                                        <Phone className="h-3 w-3" />
                                                        {contact.whatsapp}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setContactToDelete(contact.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                                className="h-8 w-8"
                                            >
                                                <Plus className="h-4 w-4 text-destructive rotate-45" />
                                            </Button>
                                        </div>
                                        {contact.tags && contact.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {contact.tags.map((tag) => (
                                                    <Badge
                                                        key={tag}
                                                        variant="secondary"
                                                        className="bg-primary/10 text-primary"
                                                    >
                                                        <Tag className="h-3 w-3 mr-1" />
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        {contact.description && (
                                            <p className="text-sm text-muted-foreground">
                                                {contact.description}
                                            </p>
                                        )}
                                    </CardContent>
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
                            Tem certeza que deseja excluir este contato? Esta ação não pode ser
                            desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => contactToDelete && deleteContact(contactToDelete)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}; 