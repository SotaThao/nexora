import { PDFDocument, rgb } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { CheckInPrintDocument, PrintAssets } from './checkInPrintTypes'
const color = (hex: string) => rgb(parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255)
export async function createCheckInPrintPdf(document: CheckInPrintDocument, assets: PrintAssets): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fonts = Object.fromEntries(await Promise.all(Object.entries(assets.fonts).map(async([id,bytes])=>[id,await pdf.embedFont(bytes,{subset:true})])))
  const images = Object.fromEntries(await Promise.all(document.assetIds.map(async id=>{
    const image=assets.images[id]
    if(!image)throw new Error('Missing print image')
    return [id,await (image.mimeType==='image/png'?pdf.embedPng(image.bytes):pdf.embedJpg(image.bytes))]
  })))
  const page=pdf.addPage([document.widthPt,document.heightPt])
  for(const node of document.nodes){
    if(node.kind==='rect')page.drawRectangle({x:node.x,y:document.heightPt-node.y-node.height,width:node.width,height:node.height,color:color(node.fill)})
    if(node.kind==='path')page.drawSvgPath(node.d,{x:node.x,y:document.heightPt-node.y,color:color(node.fill)})
    if(node.kind==='text')for(const run of node.runs)page.drawText(run.text,{x:run.x,y:document.heightPt-run.baselineY,font:fonts[run.fontId],size:run.fontSize,color:color(run.color)})
    if(node.kind==='image'){
      const image=images[node.assetId];const factor=Math.min(node.width/image.width,node.height/image.height)
      const width=image.width*factor;const height=image.height*factor
      page.drawImage(image,{x:node.x+(node.width-width)/2,y:document.heightPt-node.y-(node.height+height)/2,width,height})
    }
  }
  return pdf.save()
}
