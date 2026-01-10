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
import { supabase } from '@/lib/supabase';

const FormSchema = z.object({
  fullName: z.string().min(2, {
    message: 'Full name must be at least 2 characters.',
  }).max(50, {
    message: 'Full name must not be longer than 50 characters.',
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.',
  }),
  mobileNumber: z.string().refine((value) => {
    const digitsOnly = value.replace(/\D/g, '');
    return digitsOnly.length === 10 && /^[6-9]\d{9}$/.test(digitsOnly);
  }, {
    message: 'Please enter a valid 10-digit Indian mobile number (should start with 6, 7, 8, or 9).',
  }),
  collegeName: z.string().min(2, {
    message: 'College name is required.',
  }),
});

export function RegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      mobileNumber: '',
      collegeName: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsSubmitting(true);
    try {
      // Prepare data for Supabase
      const normalizedEmail = data.email.toLowerCase().trim();
      const normalizedCollege = data.collegeName.toLowerCase().trim();
      
      // Check if user is RIT student
      const isRITEmail = 
        normalizedEmail.endsWith('@ritchennai.edu.in') ||
        normalizedEmail.includes('@') && normalizedEmail.split('@')[1]?.includes('ritchennai');
      
      const isRITStudent =
        isRITEmail &&
        (normalizedCollege === 'rajalakshmi institute of technology' ||
          normalizedCollege === 'rit' ||
          (normalizedCollege.includes('rajalakshmi') && normalizedCollege.includes('technology')));

      const registrationData = {
        name: data.fullName.trim(),
        email: normalizedEmail,
        phone: data.mobileNumber.replace(/\D/g, ''), // Store only digits
        college: data.collegeName.trim(),
        ticket_type: 'Event',
        price: isRITStudent ? '₹500' : '₹750',
        is_rit_student: isRITStudent,
      };

      // Insert into Supabase
      const { data: insertedData, error } = await supabase
        .from('registrations')
        .insert([registrationData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        
        // Handle duplicate email error
        if (error.code === '23505' || error.message.includes('duplicate')) {
          toast({
            title: 'Registration Failed',
            description: 'This email is already registered. Please use a different email address.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Registration Failed',
            description: error.message || 'An error occurred while submitting your registration. Please try again.',
            variant: 'destructive',
          });
        }
        return;
      }

      // Success!
      console.log('Registration successful:', insertedData);
      
      // Send confirmation email via Edge Function
      if (insertedData && insertedData[0]) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        if (supabaseUrl) {
          console.log('Attempting to send confirmation email...');
          
          fetch(`${supabaseUrl}/functions/v1/send-registration-email`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseAnonKey || ''}`,
            },
            body: JSON.stringify(insertedData[0]),
          })
          .then(async (response) => {
            const result = await response.json();
            if (response.ok) {
              console.log('✅ Email sent successfully:', result);
            } else {
              console.error('❌ Email sending failed:', result);
            }
          })
          .catch((err) => {
            console.error('❌ Failed to call email function:', err);
            // Don't show error to user - email sending is not critical
          });
        }
      }
      
      toast({
        title: 'Registration Successful! 🎉',
        description: 'You have successfully registered for the event. A confirmation email will be sent shortly.',
      });
      form.reset();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: 'Registration Failed',
        description: 'An unexpected error occurred. Please try again later.',
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
              name="email"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="Enter your email (e.g., name@example.com)"
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
                      type="tel"
                      placeholder="Enter your 10-digit mobile number"
                      maxLength={10}
                      {...field}
                      className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      onChange={(e) => {
                        // Only allow digits and limit to 10 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                        field.onChange(value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Enter your 10-digit mobile number (should start with 6, 7, 8, or 9).
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
