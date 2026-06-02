// toast.jsx — thin re-export shim over sonner
// The shadcn `toast` component is deprecated in favour of `sonner`.
// This file exists so imports of @/components/ui/toast resolve correctly.
// Use the <Toaster /> from sonner.jsx and the `toast` function from "sonner" directly.
export { Toaster as ToastProvider } from "./sonner"
export { toast } from "sonner"
