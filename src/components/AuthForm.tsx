import Link from "next/link";

type AuthFormProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function AuthForm({ title, subtitle, children, footer }: AuthFormProps) {
  return (
    <div className="flex min-h-full items-center justify-center bg-stone-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Shepherd Connect
          </Link>
          <h1 className="mt-4 text-xl font-semibold text-stone-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-stone-600">{subtitle}</p>
          )}
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          {children}
        </div>

        {footer && <div className="mt-6 text-center text-sm">{footer}</div>}
      </div>
    </div>
  );
}

export const fieldClass =
  "mt-1 block w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

export const labelClass = "block text-sm font-medium text-stone-700";

export const errorClass = "mt-1 text-sm text-red-600";

export const buttonPrimaryClass =
  "w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export const buttonSecondaryClass =
  "rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2";

export function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  );
}
