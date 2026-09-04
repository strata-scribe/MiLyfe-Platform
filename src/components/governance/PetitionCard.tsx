'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formatDistanceToNow } from 'date-fns';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { FormField, SubmitButton } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import {
  Petition,
  CreatePetitionSchema,
  CreatePetition,
  PetitionStatusType,
} from '@/lib/governance/petitions';

interface PetitionCardProps {
  petition: Petition;
  hasSigned?: boolean;
  onSign?: (petitionId: string) => Promise<void>;
  isLoading?: boolean;
}

export function PetitionCard({
  petition,
  hasSigned = false,
  onSign,
  isLoading = false,
}: PetitionCardProps) {
  const isClosed = petition.status !== 'active';
  const progress = Math.min(
    (petition.signatureCount / petition.referendumThreshold) * 100,
    100
  );

  const getStatusBadge = (status: PetitionStatusType) => {
    switch (status) {
      case 'active':
        return <Badge variant="live">Active</Badge>;
      case 'successful':
        return <Badge variant="success">Successful</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return null;
    }
  };

  const handleSign = async () => {
    if (onSign && petition.id && !hasSigned && !isClosed) {
      await onSign(petition.id);
    }
  };

  return (
    <Card className="w-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <CardTitle>{petition.title}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              {getStatusBadge(petition.status)}
              <span className="text-xs text-muted-foreground">
                Ends {formatDistanceToNow(petition.expiresAt, { addSuffix: true })}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-grow space-y-4">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {petition.description}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">
              {petition.signatureCount.toLocaleString()} signatures
            </span>
            <span className="text-muted-foreground">
              {petition.referendumThreshold.toLocaleString()} needed for referendum
            </span>
          </div>
          <Progress value={progress} showLabel variant="indigo" />
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t border-gray-100 dark:border-harbor-800">
        <Button
          className="w-full"
          variant={hasSigned ? 'secondary' : 'default'}
          disabled={isClosed || hasSigned || isLoading}
          onClick={handleSign}
        >
          {hasSigned
            ? 'Already Signed'
            : isClosed
            ? 'Petition Closed'
            : 'Sign Petition'}
        </Button>
      </CardFooter>
    </Card>
  );
}

interface PetitionFormProps {
  onSubmit: (data: CreatePetition) => Promise<void>;
  isLoading?: boolean;
}

export function PetitionForm({ onSubmit, isLoading = false }: PetitionFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreatePetition>({
    resolver: zodResolver(CreatePetitionSchema),
    defaultValues: {
      authorId: 'current-user-id', // In a real app, this would come from auth context
    }
  });

  const onSubmitForm = async (data: CreatePetition) => {
    await onSubmit(data);
    reset();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a Petition</CardTitle>
        <CardDescription>
          Start a petition to gather signatures. If it reaches the threshold, it triggers a referendum.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <input type="hidden" {...register('authorId')} />

          <FormField
            label="Title"
            error={errors.title}
            description="A clear, concise title for your petition."
            required
          >
            <Input
              {...register('title')}
              placeholder="e.g., Implement ranked-choice voting for community elections"
            />
          </FormField>

          <FormField
            label="Description"
            error={errors.description}
            description="Explain why this petition is important and what action it calls for."
            required
          >
            <Textarea
              {...register('description')}
              placeholder="Detailed description..."
              className="min-h-[120px]"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Referendum Threshold"
              error={errors.referendumThreshold}
              description="Number of signatures needed."
              required
            >
              <Input
                type="number"
                {...register('referendumThreshold', { valueAsNumber: true })}
                placeholder="1000"
                min="1"
              />
            </FormField>

            <FormField
              label="Expiration Date"
              error={errors.expiresAt as any}
              description="When does this petition end?"
              required
            >
              <Input
                type="date"
                {...register('expiresAt')}
              />
            </FormField>
          </div>

          <div className="pt-4 flex justify-end">
             <SubmitButton loading={isLoading} className="w-full md:w-auto">
               Create Petition
             </SubmitButton>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
