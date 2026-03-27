
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

interface AppUser {
    id: string;
    email: string | null;
    name: string | null;
    role: string | null;
}

interface AppPage {
    id: string;
    name: string;
    route: string;
    description: string | null;
}

interface UserPageAccess {
    page_id: string;
    can_access: boolean;
}

const PageAccessControl = () => {
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [accessChanges, setAccessChanges] = useState<Record<string, boolean>>({});
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Fetch all users
    const { data: users, isLoading: isLoadingUsers } = useQuery({
        queryKey: ["app_users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("app_users")
                .select("*");

            if (error) throw error;
            return data as AppUser[];
        },
    });

    // Fetch all pages
    const { data: pages, isLoading: isLoadingPages } = useQuery({
        queryKey: ["app_pages"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("app_pages")
                .select("*")
                .order("name"); // Changed from page_name to name based on interface

            if (error) throw error;
            return data as AppPage[];
        },
    });

    // Fetch user access when a user is selected
    const { data: userAccess, isLoading: isLoadingAccess } = useQuery({
        queryKey: ["user_page_access", selectedUserId],
        enabled: !!selectedUserId,
        queryFn: async () => {
            if (!selectedUserId) return [];
            const { data, error } = await supabase
                .from("user_page_access")
                .select("page_id, can_access")
                .eq("user_id", selectedUserId);

            if (error) throw error;
            return data as UserPageAccess[];
        },
    });

    // Initialize access changes when user selection changes
    useEffect(() => {
        setAccessChanges({});
    }, [selectedUserId]);

    const handleAccessChange = (pageId: string, checked: boolean) => {
        setAccessChanges((prev) => ({
            ...prev,
            [pageId]: checked,
        }));
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            if (!selectedUserId) return;

            const updates = Object.entries(accessChanges).map(([pageId, canAccess]) => ({
                user_id: selectedUserId,
                page_id: pageId,
                can_access: canAccess,
            }));

            // We need to upsert. The constraint handles conflict on (user_id, page_id).
            const { error } = await supabase
                .from("user_page_access")
                .upsert(updates, { onConflict: "user_id,page_id" });

            if (error) throw error;
        },
        onSuccess: () => {
            toast({
                title: "Success",
                description: "Page access permissions updated successfully.",
            });
            queryClient.invalidateQueries({ queryKey: ["user_page_access", selectedUserId] });
            setAccessChanges({});
        },
        onError: (error) => {
            toast({
                variant: "destructive",
                title: "Error",
                description: `Failed to update permissions: ${error.message}`,
            });
        },
    });

    const isChecked = (pageId: string) => {
        // If explicitly changed, use that value
        if (pageId in accessChanges) {
            return accessChanges[pageId];
        }
        // Otherwise check existing access
        const existing = userAccess?.find((a) => a.page_id === pageId);
        return existing ? existing.can_access : false; // Default to false if no record
    };

    if (isLoadingUsers || isLoadingPages) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Page Access Control</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Select User</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedUserId || ""}
                        onValueChange={setSelectedUserId}
                    >
                        <SelectTrigger className="w-[300px]">
                            <SelectValue placeholder="Select a user to manage access" />
                        </SelectTrigger>
                        <SelectContent>
                            {users?.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name || user.email || user.id} ({user.role || 'No Role'}) - {user.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedUserId && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Manage Permissions</CardTitle>
                        {Object.keys(accessChanges).length > 0 && (
                            <Button
                                onClick={() => saveMutation.mutate()}
                                disabled={saveMutation.isPending}
                            >
                                {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoadingAccess ? (
                            <div className="flex items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Page Name</TableHead>
                                        <TableHead>Route</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="w-[100px]">Access</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pages?.map((page) => (
                                        <TableRow key={page.id}>
                                            <TableCell className="font-medium">{page.name}</TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-sm">{page.route}</TableCell>
                                            <TableCell>{page.description}</TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={isChecked(page.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleAccessChange(page.id, checked as boolean)
                                                    }
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default PageAccessControl;
