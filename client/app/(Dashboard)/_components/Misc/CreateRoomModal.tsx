"use client";

import { Fragment } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RoomSchema, RoomFormValues } from "@/lib/schemas/roomSchema";
import { RoomTypeLabel } from "@/lib/constants/FilteType";
import { LanguageMetaMap } from "@/lib/constants/AvailableLanguages";
import { Languages, RoomType } from "@/generated/prisma/enums";

import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import axios from "@/lib/axios";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateRoomModal({ isOpen, onClose }: CreateRoomModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<RoomFormValues>({
    resolver: zodResolver(RoomSchema),
    defaultValues: {
      name: "",
      type: RoomType.SINGLE,
      language: Languages.JAVASCRIPT,
    },
    mode: "onTouched",
  });

  const createRoomMutation = useMutation({
    mutationFn: async (payload: RoomFormValues) => {
      const response = await axios.post("/createroom", {
        ...payload,
        name: payload.name.trim(),
      });
      return response.data;
    },
    onSuccess: (result) => {
      queryClient.removeQueries({
        queryKey: ["rooms"],
      });

      toast.success("Room Created Successfully!");
      form.reset();
      onClose();
      router.push(`/room/${result.room.id}`);
    },
    onError: (err) => {
      if (err instanceof AxiosError) {
        toast.error(err.response?.data?.error || "Failed to create room");
        console.error(err.stack);
      }
    },
  });

  const onSubmit: SubmitHandler<RoomFormValues> = async (data) => {
    await createRoomMutation.mutateAsync(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="lg:max-w-xl" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Create New Room</DialogTitle>
        </DialogHeader>

        <TooltipProvider>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Room Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Room Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. DSA Practice" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Room Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Room Type</FormLabel>

                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="space-y-3"
                      >
                        {Object.values(RoomType).map((value) => {
                          const isComingSoon = value === RoomType.MULTI;
                          const id = `room-type-${value}`;

                          return (
                            <FieldLabel key={value} htmlFor={id}>
                              <Field
                                orientation="horizontal"
                                className={`border-border flex cursor-pointer items-center gap-4 rounded-lg border p-4 transition-colors ${
                                  isComingSoon
                                    ? "cursor-not-allowed opacity-60"
                                    : "hover:bg-secondary/40"
                                }`}
                              >
                                <RadioGroupItem
                                  value={value}
                                  id={id}
                                  disabled={isComingSoon}
                                />

                                <FieldContent className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <FieldTitle>
                                      {RoomTypeLabel[value]}
                                    </FieldTitle>

                                    {isComingSoon && <Badge>Coming Soon</Badge>}
                                  </div>

                                  <FieldDescription>
                                    {value === RoomType.SINGLE
                                      ? "Perfect for small projects or snippets"
                                      : "For complex projects with multiple files"}
                                  </FieldDescription>
                                </FieldContent>
                              </Field>
                            </FieldLabel>
                          );
                        })}
                      </RadioGroup>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Language */}
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      Language
                    </FormLabel>

                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full py-6">
                          <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                      </FormControl>

                      <SelectContent>
                        {Object.values(Languages).map((lang, idx) => (
                          <Fragment key={lang}>
                            <Tooltip delayDuration={1500}>
                              <TooltipTrigger asChild>
                                <SelectItem value={lang}>
                                  <div className="flex items-center gap-x-2">
                                    <Image
                                      src={LanguageMetaMap[lang].imageUrl}
                                      alt={`${LanguageMetaMap[lang].displayName} Logo`}
                                      loading="eager"
                                      width={12}
                                      height={12}
                                      className="w-fit"
                                    />
                                    <span>
                                      {LanguageMetaMap[lang].displayName}
                                    </span>
                                  </div>
                                </SelectItem>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                {LanguageMetaMap[lang].languageInfo}
                              </TooltipContent>
                            </Tooltip>
                            {idx < Object.values(Languages).length - 1 && (
                              <Separator />
                            )}
                          </Fragment>
                        ))}
                      </SelectContent>
                    </Select>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 cursor-pointer"
                  onClick={onClose}
                  disabled={createRoomMutation.isPending}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="flex-1 cursor-pointer"
                  disabled={createRoomMutation.isPending}
                >
                  {createRoomMutation.isPending ? "Creating..." : "Create Room"}
                </Button>
              </div>
            </form>
          </Form>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}
