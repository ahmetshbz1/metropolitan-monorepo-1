import { useCallback, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Card, CardBody, CardHeader, Input, Spacer } from "@heroui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { loginAdmin, type AdminLoginResponse } from "../api/auth";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "E-posta gereklidir")
    .email("Geçerli bir e-posta adresi giriniz"),
  password: z
    .string()
    .min(12, "Parola en az 12 karakter olmalıdır")
    .max(128, "Parola 128 karakteri aşmamalıdır"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export interface LoginPageProps {
  onSuccess: (payload: AdminLoginResponse) => void;
}

export const LoginPage = ({ onSuccess }: LoginPageProps) => {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });

  const onSubmit = useCallback(
    async (values: LoginFormValues) => {
      setSubmitError(null);
      try {
        const result = await loginAdmin(values);
        onSuccess(result);
      } catch (error) {
        console.error("Admin login failed", error);
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Giriş işlemi başarısız oldu"
        );
      }
    },
    [onSuccess]
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-col items-start gap-2 pb-0">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Metropolitan Admin
          </h1>
          <p className="text-sm text-default-500">
            Lütfen yönetici hesabınızla giriş yapın.
          </p>
        </CardHeader>
        <CardBody className="pt-6">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
            <Input
              label="E-posta"
              placeholder="admin@metropolitan.com"
              type="email"
              {...register("email")}
              isInvalid={Boolean(errors.email)}
              errorMessage={errors.email?.message}
              autoComplete="email"
              variant="bordered"
            />
            <Input
              label="Parola"
              placeholder="Parolanızı giriniz"
              type="password"
              {...register("password")}
              isInvalid={Boolean(errors.password)}
              errorMessage={errors.password?.message}
              autoComplete="current-password"
              variant="bordered"
            />
            {submitError ? (
              <p className="text-sm text-red-500" role="alert">
                {submitError}
              </p>
            ) : null}
            <Spacer y={1} />
            <Button
              color="primary"
              type="submit"
              isLoading={isSubmitting}
              className="w-full"
            >
              Giriş Yap
            </Button>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};
