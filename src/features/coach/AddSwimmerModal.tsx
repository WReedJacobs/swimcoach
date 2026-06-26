import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAddSwimmer } from '@/hooks/useSwimmers'
import type { Level } from '@/types'

const schema = z.object({
  full_name: z.string().min(2, 'Enter a name'),
  email: z.string().email('Invalid email').or(z.literal('')),
  level: z.enum(['beginner', 'intermediate', 'elite']),
  squad: z.string(),
  notes: z.string(),
})
type FormValues = z.infer<typeof schema>

export function AddSwimmerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addSwimmer = useAddSwimmer()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { level: 'beginner', squad: '', notes: '', email: '' },
  })

  const onSubmit = async (values: FormValues) => {
    await addSwimmer.mutateAsync({
      full_name: values.full_name,
      email: values.email,
      level: values.level as Level,
      squad: values.squad,
      notes: values.notes,
    })
    reset()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add swimmer">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Full name" placeholder="Jamie Rivers" error={errors.full_name?.message} {...register('full_name')} />
        <Input
          label="Email (to invite later)"
          type="email"
          placeholder="jamie@example.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <div className="grid grid-cols-2 gap-3">
          <Select label="Level" {...register('level')}>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="elite">Elite</option>
          </Select>
          <Input label="Squad" placeholder="Senior" {...register('squad')} />
        </div>
        <Textarea label="Notes" placeholder="Anything to remember about this swimmer" {...register('notes')} />
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={addSwimmer.isPending}>
            Add swimmer
          </Button>
        </div>
      </form>
    </Modal>
  )
}
