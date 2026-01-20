import { redirect } from "next/navigation";

export default function AppPage() {
    // Wenn jemand app.klargehalt.de ohne Pfad aufruft, schicken wir ihn direkt zum Dashboard
    redirect("/dashboard");
}
