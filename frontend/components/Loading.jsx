export default function Loading() {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
      <span className="ml-3 text-lg font-medium">Loading...</span>
    </div>
  )
}
