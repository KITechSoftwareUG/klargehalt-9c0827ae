import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:rounded-xl font-medium",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          error:
            "group-[.toaster]:border-destructive/30 group-[.toaster]:bg-destructive/5 group-[.toaster]:text-destructive dark:group-[.toaster]:bg-destructive/10 dark:group-[.toaster]:text-destructive-foreground",
          success:
            "group-[.toaster]:border-green-500/30 group-[.toaster]:bg-green-500/5 group-[.toaster]:text-green-700 dark:group-[.toaster]:text-green-400 dark:group-[.toaster]:bg-green-500/10",
          warning:
            "group-[.toaster]:border-yellow-500/30 group-[.toaster]:bg-yellow-500/5 group-[.toaster]:text-yellow-700 dark:group-[.toaster]:text-yellow-400 dark:group-[.toaster]:bg-yellow-500/10",
          info:
            "group-[.toaster]:border-blue-500/30 group-[.toaster]:bg-blue-500/5 group-[.toaster]:text-blue-700 dark:group-[.toaster]:text-blue-400 dark:group-[.toaster]:bg-blue-500/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
