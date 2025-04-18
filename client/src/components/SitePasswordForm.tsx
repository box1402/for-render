import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { sitePasswordSchema } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SitePasswordFormProps {
  onSubmit: (password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const SitePasswordForm: React.FC<SitePasswordFormProps> = ({
  onSubmit,
  loading: externalLoading,
  error: externalError,
}) => {
  // Internal form state
  const [internalError, setInternalError] = useState<string | null>(null);
  const [internalLoading, setInternalLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<z.infer<typeof sitePasswordSchema>>({
    resolver: zodResolver(sitePasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const handleFormSubmit = async (values: z.infer<typeof sitePasswordSchema>) => {
    // Clear any previous errors
    setInternalError(null);
    setInternalLoading(true);
    
    try {
      console.log("SitePasswordForm: Submitting with password:", values.password);
      
      // Call the onSubmit function from props
      await onSubmit(values.password);
      
      // Reset form after successful submission
      form.reset();
    } catch (error) {
      console.error("Form submission error:", error);
      setInternalError("An unexpected error occurred during submission");
    } finally {
      setInternalLoading(false);
    }
  };
  
  // Combined loading and error states (prioritize internal states over external ones)
  const loading = internalLoading || externalLoading;
  const error = internalError || externalError;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Enter Site Password</CardTitle>
        <CardDescription>
          This site is password protected to ensure privacy. Please enter the site password to access the content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                          <Lock className="h-4 w-4" />
                        </div>
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter site password"
                          className="pl-10 pr-10"
                          {...field}
                          disabled={loading}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={loading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Access Content"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-neutral-500 pt-0">
        <p>Password: gabby1218814!</p>
      </CardFooter>
    </Card>
  );
};

export default SitePasswordForm;