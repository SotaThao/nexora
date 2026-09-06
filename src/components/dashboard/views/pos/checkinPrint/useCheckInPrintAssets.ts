import { useCallback, useEffect, useState } from 'react'
import { CHECK_IN_FONT_FAMILIES } from './CheckInPrintPreview'
import type { PrintAssets, TextRun } from './checkInPrintTypes'
const FONT_FILES = {body:'NotoSans-Regular.ttf',bodyBold:'NotoSans-Bold.ttf',heading:'NotoSerif-Regular.ttf'}
type LoadedFonts = Pick<PrintAssets,'fonts'|'measureText'>
let fontPromise: Promise<LoadedFonts> | null = null
async function loadFonts(): Promise<LoadedFonts> {
  if(fontPromise)return fontPromise
  fontPromise=(async()=>{
    const { default: fontkit }=await import('@pdf-lib/fontkit')
    const entries=await Promise.all(Object.entries(FONT_FILES).map(async([id,file])=>{
      const response=await fetch(`${import.meta.env.BASE_URL}fonts/checkin/${file}`)
      if(!response.ok)throw new Error('Font unavailable')
      const bytes=new Uint8Array(await response.arrayBuffer())
      const face=new FontFace(CHECK_IN_FONT_FAMILIES[id as TextRun['fontId']],bytes.slice().buffer)
      await face.load();document.fonts.add(face)
      return [id,bytes] as const
    }))
    const fonts=Object.fromEntries(entries)
    const parsed=Object.fromEntries(entries.map(([id,bytes])=>[id,fontkit.create(bytes)]))
    return {fonts,measureText:(id:TextRun['fontId'],text:string,size:number)=>parsed[id].layout(text).glyphs.reduce((sum,glyph)=>sum+glyph.advanceWidth,0)*size/parsed[id].unitsPerEm}
  })().catch(error=>{fontPromise=null;throw error})
  return fontPromise
}
interface AssetState {status:'loading'|'ready'|'error';assets:PrintAssets|null;error:'font'|'logo'|null;source:string|null}
export function useCheckInPrintAssets(logoUrl: string | null) {
  const [attempt,setAttempt]=useState(0)
  const [state,setState]=useState<AssetState>({status:'loading',assets:null,error:null,source:logoUrl})
  const retry=useCallback(()=>setAttempt(value=>value+1),[])
  useEffect(()=>{
    let cancelled=false;let objectUrl:string|undefined
    const controller=new AbortController()
    setState({status:'loading',assets:null,error:null,source:logoUrl})
    void(async()=>{
      let stage:'font'|'logo'='font'
      try {
        const fonts=await loadFonts()
        if(cancelled)return
        const images:PrintAssets['images']={}
        if(logoUrl){
          stage='logo'
          const response=await fetch(logoUrl,{signal:controller.signal})
          if(!response.ok)throw new Error('Logo unavailable')
          const blob=await response.blob()
          if(blob.size>10*1024*1024)throw new Error('Logo too large')
          const bytes=new Uint8Array(await blob.arrayBuffer())
          if(cancelled)return
          const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71
          const jpeg=bytes[0]===255&&bytes[1]===216
          if(!png&&!jpeg)throw new Error('Unsupported logo format')
          const mimeType=png?'image/png':'image/jpeg'
          objectUrl=URL.createObjectURL(new Blob([bytes],{type:mimeType}))
          const image=new Image();image.src=objectUrl;await image.decode()
          if(cancelled)return
          images.logo={bytes,mimeType,objectUrl}
        }
        if(!cancelled)setState({status:'ready',assets:{...fonts,images},error:null,source:logoUrl})
      }catch {if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=undefined}if(!cancelled)setState({status:'error',assets:null,error:stage,source:logoUrl})}
    })()
    return()=>{cancelled=true;controller.abort();if(objectUrl)URL.revokeObjectURL(objectUrl)}
  },[logoUrl,attempt])
  // Never expose the prior business logo between render and the next effect.
  return state.source===logoUrl?{...state,retry}:{status:'loading' as const,assets:null,error:null,retry}
}
