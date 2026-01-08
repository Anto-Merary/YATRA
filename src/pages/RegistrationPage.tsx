import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';

const FormSchema = z.object({
  fullName: z.string().max(50, {
    message: 'Full name must not be longer than 50 characters.',
  }),
  mobileNumber: z.string().refine((value) => /^\d{10}$/.test(value), {
    message: 'Mobile number must be exactly 10 digits.',
  }),
  collegeName: z.string().min(1, {
    message: 'College name is required.',
  }),
});

export function RegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      mobileNumber: '',
      collegeName: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      console.log('Form submitted successfully:', data);
      toast({
        title: 'Registration Successful!',
        description: 'You have successfully registered for the event.',
      });
      form.reset();
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast({
        title: 'Registration Failed',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white px-4 py-8" style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="w-full max-w-md p-6 sm:p-8 space-y-6 sm:space-y-8 bg-gray-800 rounded-lg shadow-lg">
        <h1 className="text-2xl sm:text-3xl font-bold text-center text-purple-400">
          YATRA 2026 Registration
        </h1>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your full name"
                      {...field}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your 10-digit mobile number"
                      {...field}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your 10-digit mobile number.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="collegeName"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>College Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter your college name"
                      {...field}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the name of your college.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 touch-manipulation"
              disabled={isSubmitting}
              style={{ minHeight: "44px" }}
            >
              {isSubmitting ? 'Registering...' : 'Register Now'}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default RegistrationPage;
