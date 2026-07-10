import { SettingsView } from "@/components/settings-view";
import { getSession } from "@/lib/auth";
import { getNutritionGoals } from "@/lib/data/settings";

export default async function ParametresPage() {
    const { userId } = (await getSession())!;
    const goals = await getNutritionGoals(userId);
    return <SettingsView proteinGoal={goals.proteinGoal} calorieGoal={goals.calorieGoal} />;
}
