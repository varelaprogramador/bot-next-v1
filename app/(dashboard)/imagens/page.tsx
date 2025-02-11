"use client";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@clerk/nextjs";
import { Dialog, DialogTrigger } from "@radix-ui/react-dialog";
import { Download, Folder, Loader2, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useEffect, useState } from "react";

export interface FileObject {
  name: string;
  size: number;
  type: string;
  url: string;
  qtd: number; // Número de itens para pastas
}

export default function GaleriaPage() {
  const [folders, setFolders] = useState<FileObject[]>([]); // Estado para as pastas
  const [files, setFiles] = useState<FileObject[]>([]); // Estado para os arquivos
  const [uploading, setUploading] = useState(false);
  const [create, setCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false); // Estado para abrir a modal
  const [folderItems, setFolderItems] = useState<FileObject[]>([]); // Itens da pasta
  const { user } = useUser();
  const supabase = createClient();
  const [selectedFolder, setSelectedFolder] = useState("");

  const isImageFile = (type: string) => type === "image";
  const isPdfFile = (type: string) => type === "pdf";
  const [isNameFolder, setIsNameFolder] = useState("");
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length) return;

    const file = event.target.files[0];
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
  };
  const createFolder = async (folderName: string) => {
    if (!user) return;

    try {
      // Criar um arquivo "fictício" de tipo text/plain
      const emptyFile = new Blob([""], { type: "text/plain" });

      // Realizar o upload do arquivo na pasta desejada
      const { error: uploadError } = await supabase.storage
        .from("galeria")
        .upload(`${user.id}/${folderName}/.emptyfile`, emptyFile);

      if (uploadError) throw uploadError;
      await fetchFiles();
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const fetchFiles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from("galeria")
        .list(`${user.id}/`);

      if (data) {
        const filesWithUrls = await Promise.all(
          data.map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("galeria")
              .getPublicUrl(`${user.id}/${file.name}`);

            if (file.metadata != null) {
              // Arquivo (não pasta)
              return {
                name: file.name,
                size: file.metadata?.size || 0,
                type: file.metadata?.mimetype || "unknown",
                url: publicUrl,
                qtd: 0, // Arquivos não têm itens
              };
            } else {
              // Pasta (sem metadata)
              return {
                name: file.name,
                size: 0,
                type: "folder",
                url: publicUrl,
                qtd: 0, // Inicialmente sem contar os itens
              };
            }
          })
        );

        // Separando arquivos e pastas
        const filesList = filesWithUrls.filter(
          (file) => file.type !== "folder"
        );
        const foldersList = filesWithUrls.filter(
          (file) => file.type === "folder"
        );

        setFiles(filesList);
        setFolders(foldersList);

        // Atualizar qtd de itens nas pastas
        for (const folder of foldersList) {
          const { data } = await supabase.storage
            .from("galeria")
            .list(`${user.id}/${folder.name}/`);
          folder.qtd = data?.length || 0;
        }
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolderItems = async (folderName: string) => {
    if (!user) return;

    try {
      setLoading(true);
      // Listar itens dentro da pasta
      const { data, error } = await supabase.storage
        .from("galeria")
        .list(`${user.id}/${folderName}/`);

      if (data) {
        const folderItemsWithUrls = await Promise.all(
          data.map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage
              .from("galeria")
              .getPublicUrl(`${user.id}/${folderName}/${file.name}`);

            return {
              name: file.name,
              size: file.metadata?.size || 0,
              type: file.metadata?.mimetype || "unknown",
              url: publicUrl,
              qtd: 0, // Arquivos dentro da pasta, não têm itens
            };
          })
        );
        setFolderItems(folderItemsWithUrls);
      }
    } catch (error) {
      console.error("Error fetching folder items:", error);
    } finally {
      setLoading(false);
    }
  };

  const openFolder = (folderName: string) => {
    // Buscar itens da pasta e abrir a modal
    fetchFolderItems(folderName);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFolderItems([]); // Limpar os itens da pasta ao fechar
  };
  const [nomeFile, setNomeFile] = useState<
    ChangeEvent<HTMLInputElement> | string
  >("");
  // Handle file upload
  const uploadFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !user || !selectedFolder) return;

    try {
      setUploading(true);
      const file = event.target.files[0];
      if (selectedFolder != "N/A") {
        // Upload para a pasta selecionada
        const { error } = await supabase.storage
          .from("galeria")
          .upload(`${user.id}/${selectedFolder}/${file.name}`, file);
        if (error) throw error;
      } else {
        const { error } = await supabase.storage
          .from("galeria")
          .upload(`${user.id}/${file.name}`, file);
        if (error) throw error;
      }

      // Recarregar os arquivos após o upload
      await fetchFiles();
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  // Atualizar pasta selecionada
  const handleFolderSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedFolder(e.target.value);
  };

  const deleteFile = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from("galeria")
        .remove([`${user.id}/${fileName}`]);

      if (error) throw error;

      await fetchFiles();
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  };
  const deleteFolder = async (folderName: string) => {
    if (!user) return;

    try {
      // Listar todos os arquivos dentro da pasta
      const { data: files, error: listError } = await supabase.storage
        .from("galeria")
        .list(`${user.id}/${folderName}/`);

      if (listError) throw listError;

      // Remover os arquivos dentro da pasta
      const deletePromises = files.map((file) =>
        supabase.storage
          .from("galeria")
          .remove([`${user.id}/${folderName}/${file.name}`])
      );

      const deleteResults = await Promise.all(deletePromises);
      const deleteError = deleteResults.find((result) => result.error);
      if (deleteError) throw deleteError.error;

      // Agora podemos excluir a própria pasta (por exemplo, removendo o arquivo "fictício" de pasta)
      const { error: folderDeleteError } = await supabase.storage
        .from("galeria")
        .remove([`${user.id}/${folderName}/.emptyfile`]);

      if (folderDeleteError) throw folderDeleteError;

      // Recarregar arquivos após a exclusão
      await fetchFiles();
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const downloadFolder = async (folderName: string) => {
    if (!user) return;

    try {
      // Listar todos os arquivos dentro da pasta
      const { data: files, error: listError } = await supabase.storage
        .from("galeria")
        .list(`${user.id}/${folderName}/`);

      if (listError) throw listError;

      // Gerar links públicos para os arquivos dentro da pasta
      const downloadUrls = files.map(
        (file) =>
          supabase.storage
            .from("galeria")
            .getPublicUrl(`${user.id}/${folderName}/${file.name}`).data
            .publicUrl
      );

      // Aqui seria necessário chamar um endpoint backend para compactar os arquivos e gerar um link para o download
      // Exemplo: enviar esses links para um servidor que compacta os arquivos e retorna um link para o arquivo .zip.

      alert("Download da pasta não implementado (requere backend)");
      console.log("Links de download para os arquivos na pasta:", downloadUrls);
    } catch (error) {
      console.error("Error downloading folder:", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold mb-6">Gerenciamento de galeria</h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              Nova Pasta <Folder></Folder>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Criar Pasta</DialogTitle>
              <DialogDescription>
                Crie uma nova pasta para organizar seus galeria.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-4 mt-2">
              <Input
                id="create-Folder"
                type="text"
                onChange={(e) => setIsNameFolder(e.target.value)}
                disabled={create}
              />
              <Button
                disabled={create}
                onClick={() => createFolder(isNameFolder)}
              >
                {create ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      {/* Formulário de Upload */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 mt-2">
          <select
            value={selectedFolder}
            onChange={handleFolderSelect}
            className="p-2 border rounded"
          >
            <option value="" disabled>
              Selecione uma pasta
            </option>
            {folders.map((folder) => (
              <option key={folder.name} value={folder.name}>
                {folder.name}
              </option>
            ))}
            <option key={"empty"} value="N/A">
              Não atribuir a nenhuma pasta
            </option>
          </select>

          <Input
            id="file-upload"
            type="file"
            onChange={setNomeFile}
            accept=".pdf,.png,.jpg,.jpeg"
            disabled={uploading || !selectedFolder}
          />
          <Button
            onClick={() =>
              uploadFile(nomeFile as ChangeEvent<HTMLInputElement>)
            }
            className={`${
              uploading ? "opacity-50 cursor-not-allowed animate-pulse" : ""
            }`}
            disabled={uploading || !selectedFolder}
          >
            {uploading ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Card>

      {/* Exibindo Pastas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {folders.map((folder) => (
          <Card
            key={folder.name}
            className="p-4 cursor-pointer"
            onClick={() => openFolder(folder.name)}
          >
            <div className="flex gap-2 justify-between items-center">
              <Button variant="outline" size={"icon"}>
                <Folder className="h-4 w-4" />
              </Button>
              <div className="flex flex-col gap-2">
                <h3 className="font-medium">{folder.name}</h3>
                <p className="text-sm text-gray-500">{folder.qtd} Item(s)</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size={"icon"}
                  onClick={() => downloadFolder(folder.name)}
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="destructive"
                  size={"icon"}
                  onClick={() => deleteFolder(folder.name)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal com itens da pasta */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-1/2 max-h-80 overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Itens na Pasta</h2>
            <div className="space-y-4">
              {folderItems.map((item) => (
                <div
                  key={item.name}
                  className="flex justify-between items-center"
                >
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {(item.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(item.url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteFile(item.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 text-right">
              <Button variant="outline" onClick={closeModal}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Exibindo Arquivos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {files.map((file) => (
          <Card key={file.name} className="p-4">
            <div className="flex flex-col gap-2">
              {isImageFile(file.type) && (
                <div className="relative w-full h-48">
                  <Image
                    src={file.url}
                    alt={file.name}
                    fill
                    className="object-contain rounded-lg"
                  />
                </div>
              )}
              {isPdfFile(file.type) && (
                <div className="bg-gray-100 p-4 rounded-lg text-center">
                  <p className="text-gray-600">PDF galeriaument</p>
                </div>
              )}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{file.name}</h3>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => window.open(file.url, "_blank")}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteFile(file.name)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}