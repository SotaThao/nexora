import Skeleton from '../../ui/skeleton/Skeleton'

export default function ReportsTableSkeleton({
  rows = 10,
  columns = 8,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-t border-nexoraRule">
          {Array.from({ length: columns }).map((__, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton
                width={
                  colIndex === 0
                    ? '85%'
                    : colIndex === columns - 1
                      ? '50%'
                      : '65%'
                }
                height={14}
                borderRadius={6}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
