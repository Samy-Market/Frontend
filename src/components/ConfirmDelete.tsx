import { ReactNode, useState } from 'react';
import { Button, Modal } from './ui';
import { useToast } from './toast';
import { errorMessage } from '@/lib/api';

interface Props {
  what: string;
  feminine?: boolean;
  name: string;
  blockedReason?: string | null;
  children?: ReactNode;
  onDelete: () => Promise<unknown>;
  onDeleted?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function ConfirmDelete({ what, feminine, name, blockedReason, children, onDelete, onDeleted, size = 'sm', className }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const reason = blockedReason ?? error;

  const close = () => {
    setOpen(false);
    setError(null);
  };

  const confirm = async () => {
    setPending(true);
    try {
      await onDelete();
      toast.success(`${capitalize(what)} ${feminine ? 'eliminada' : 'eliminado'}`, name);
      close();
      onDeleted?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size={size}
        className={className ?? 'text-red-700'}
        onClick={() => setOpen(true)}
        aria-label={`Eliminar ${what} ${name}`}
      >
        Eliminar
      </Button>
      <Modal
        open={open}
        onClose={close}
        title={reason ? `No se puede eliminar` : `Eliminar ${what}`}
        footer={
          reason ? (
            <Button variant="secondary" onClick={close}>
              Entendido
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={close}>
                Cancelar
              </Button>
              <Button variant="danger" loading={pending} onClick={() => void confirm()}>
                Eliminar
              </Button>
            </>
          )
        }
      >
        {reason ? (
          <p role="alert" className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <strong>{name}</strong>: {reason}
          </p>
        ) : (
          <div className="space-y-2 text-sm">
            <p>
              ¿Eliminar {feminine ? 'la' : 'el'} {what} <strong>{name}</strong>? Esta acción no se puede deshacer.
            </p>
            {children}
          </div>
        )}
      </Modal>
    </>
  );
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
