import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { OperatorTile } from "@/components/OperatorTile";
import { Loader2 } from "lucide-react";
import type { Favorite } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";

export default function TestOperatorTiles() {
  const { user } = useAuth();
  const customerId = user?.id || "";

  const { data: operatorCards, isLoading } = useQuery<any[]>({
    queryKey: ['/api/operator-cards'],
  });

  const { data: favorites = [] } = useQuery<Favorite[]>({
    queryKey: [`/api/favorites/${customerId}`],
    enabled: !!customerId,
  });

  const isFavorite = (operatorId: string) => {
    return favorites.some(fav => fav.operatorId === operatorId);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Operator Tiles Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing consolidated operator tiles with real data from /api/operator-cards
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="ml-3 text-gray-600 dark:text-gray-400">Loading operator cards...</p>
          </div>
        ) : !operatorCards ? (
          <div className="text-center py-20">
            <p className="text-red-500">Failed to load operator cards</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-2">
                API Response Summary
              </h2>
              <div className="space-y-1 text-sm">
                <p className="text-gray-600 dark:text-gray-400">
                  Total operator cards: <span className="font-bold text-black dark:text-white">{operatorCards?.length || 0}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  With multiple tiers: <span className="font-bold text-black dark:text-white">
                    {operatorCards?.filter(op => op.subscribedTiers.length > 1).length || 0}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  With reviews: <span className="font-bold text-black dark:text-white">
                    {operatorCards?.filter(op => op.reviewCount > 0).length || 0}
                  </span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  With equipment: <span className="font-bold text-black dark:text-white">
                    {operatorCards?.filter(op => op.equipmentInventory && op.equipmentInventory.length > 0).length || 0}
                  </span>
                </p>
              </div>
            </div>

            {/* Temporarily show raw data instead of tiles to debug */}
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-black dark:text-white mb-4">
                Operator Cards (Raw Data)
              </h2>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {operatorCards?.map((op, index) => (
                  <div key={op.operatorId} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                    <p className="font-bold">{index + 1}. {op.name}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Email: {op.email} | Active: {op.activeTier} | Tiers: [{op.subscribedTiers.join(', ')}]
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
