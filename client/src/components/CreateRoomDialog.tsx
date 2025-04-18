import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { VideoContent } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Create form validation schema
const createRoomSchema = z.object({
  name: z.string()
    .min(3, { message: "Room name must be at least 3 characters" })
    .max(30, { message: "Room name must be 30 characters or less" })
    .regex(/^[a-zA-Z0-9-_]+$/, {
      message: "Room name can only contain letters, numbers, hyphens and underscores",
    }),
  password: z.string()
    .min(4, { message: "Password must be at least 4 characters" })
    .max(50, { message: "Password must be 50 characters or less" }),
});

type CreateRoomFormValues = z.infer<typeof createRoomSchema>;

interface CreateRoomDialogProps {
  content: VideoContent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  content,
  open,
  onOpenChange,
}) => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<CreateRoomFormValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      name: "",
      password: "",
    },
  });
  
  const isSubmitting = form.formState.isSubmitting;
  
  const onSubmit = async (values: CreateRoomFormValues) => {
    try {
      // Create room API call
      const response = await apiRequest('POST', '/api/rooms', {
        ...values,
        contentId: content.id,
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Room created!",
          description: "Your room has been created successfully.",
        });
        
        // Close dialog
        onOpenChange(false);
        
        // Navigate to login page for the room
        navigate(`/auth?room=${values.name}`);
      } else {
        toast({
          title: "Error creating room",
          description: data.message || "An error occurred while creating the room. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating room:", error);
      toast({
        title: "Error creating room",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Viewing Room</DialogTitle>
          <DialogDescription>
            Create a private room to watch "{content.title}" with a friend.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room Name</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter a unique room name" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Set a room password" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Room"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateRoomDialog;