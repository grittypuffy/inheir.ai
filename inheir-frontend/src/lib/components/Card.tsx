import { FeatureData } from "@/lib/validators/types";

export const Card = ({ feature }: { feature: FeatureData; }) => {
  return (
    <>
      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-gray-700">{feature.description}</p>
        </div>
      </div>
    </>
  )
}
