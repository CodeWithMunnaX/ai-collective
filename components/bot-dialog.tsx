"use client"

import { useState, type ReactElement } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { nanoid } from "nanoid"
import { Controller, useForm } from "react-hook-form"
import { ShuffleIcon } from "lucide-react"

import { createBot } from "@/actions/bot"
import { ChatAvatar } from "@/components/chat-avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { insertBotSchema, type InsertBot } from "@/lib/db/schema"

const JOB_PRESETS = [
  "Research assistant",
  "Code reviewer",
  "Writing editor",
  "Tutor",
]

const emptyValues = (): InsertBot => ({
  name: "",
  job: "",
  instruction: "",
  avatar: nanoid(),
})

export function BotDialog({ trigger }: { trigger: ReactElement }) {
  const [open, setOpen] = useState(false)
  const form = useForm<InsertBot>({
    resolver: zodResolver(insertBotSchema),
    defaultValues: emptyValues(),
  })
  const { isSubmitting } = form.formState

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) form.reset(emptyValues())
  }

  async function onSubmit(values: InsertBot) {
    const result = await createBot(values)
    if (!result.ok) {
      form.setError("root", { message: result.error })
      return
    }
    handleOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent className="max-w-[min(32rem,calc(100%-2rem))]! gap-5 p-5">
        <DialogHeader>
          <DialogTitle>New bot</DialogTitle>
          <DialogDescription>
            Give it a face, a name, and a job to do.
          </DialogDescription>
        </DialogHeader>

        <form
          id="bot-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap gap-2">
            {JOB_PRESETS.map((job) => (
              <Button
                key={job}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  form.setValue("job", job, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              >
                {job}
              </Button>
            ))}
          </div>

          <FieldGroup>
            <Controller
              name="avatar"
              control={form.control}
              render={({ field }) => (
                <Field orientation="horizontal">
                  <ChatAvatar seed={field.value} className="size-12" />
                  <FieldContent>
                    <FieldLabel>Face</FieldLabel>
                    <FieldDescription>
                      Shuffle until you find one you like.
                    </FieldDescription>
                  </FieldContent>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange(nanoid())}
                  >
                    <ShuffleIcon data-icon="inline-start" />
                    Shuffle
                  </Button>
                </Field>
              )}
            />

            <Controller
              name="name"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-name">Name</FieldLabel>
                  <Input
                    {...field}
                    id="bot-name"
                    placeholder="Ada"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="job"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-job">Job</FieldLabel>
                  <Input
                    {...field}
                    id="bot-job"
                    placeholder="Research assistant"
                    autoComplete="off"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="instruction"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bot-instruction">
                    How it should work
                  </FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id="bot-instruction"
                    placeholder="Answer briefly, cite sources, and ask before running anything destructive."
                    className="min-h-24"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} />
          )}
        </form>

        <DialogFooter className="-mx-5 -mb-5 px-5 py-4">
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>
          <Button type="submit" form="bot-form" disabled={isSubmitting}>
            {isSubmitting && <Spinner data-icon="inline-start" />}
            Create bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
