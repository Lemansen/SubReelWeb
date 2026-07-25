import { redirect } from "next/navigation";

export default function CommunityPage() {
  // Перекидываем на общую страницу "В разработке"
  redirect("/dev");
}