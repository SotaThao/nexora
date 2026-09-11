import type { CheckInPrintDocument, PrintAssets } from './checkInPrintTypes'
export const CHECK_IN_FONT_FAMILIES = { body: 'CheckInNotoSans', bodyBold: 'CheckInNotoSansBold', heading: 'CheckInNotoSerif', inter: 'OneQrInter' }
export function CheckInPrintPreview({ document, assets, className }: { document: CheckInPrintDocument; assets: PrintAssets; className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox={`0 0 ${document.widthPt} ${document.heightPt}`} width="100%" height="100%" role="img" aria-label={document.qrUrl} style={{display:'block',aspectRatio:`${document.widthPt}/${document.heightPt}`}}>
    {document.nodes.map((node,i)=>{
      switch(node.kind){
        case 'rect': return <rect key={i} x={node.x} y={node.y} width={node.width} height={node.height} fill={node.fill}/>
        case 'path': return <path key={i} d={node.d} transform={`translate(${node.x} ${node.y})`} fill={node.fill} shapeRendering={node.fill === '#000000' ? 'crispEdges' : 'geometricPrecision'}/>
        case 'image': return <image key={i} href={assets.images[node.assetId]?.objectUrl} x={node.x} y={node.y} width={node.width} height={node.height} preserveAspectRatio="xMidYMid meet"/>
        case 'text': return <g key={i}>{node.runs.map((run,j)=><text key={j} x={run.x} y={run.baselineY} fontFamily={CHECK_IN_FONT_FAMILIES[run.fontId]} fontSize={run.fontSize} fontWeight="normal" style={{fontKerning:"none"}} fill={run.color}>{run.text}</text>)}</g>
      }
    })}
  </svg>
}
