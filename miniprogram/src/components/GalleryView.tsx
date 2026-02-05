import { View, Text, Image, ScrollView, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import { Project, PhotoAspectRatio } from '@/types'
import * as cloudService from '@/services/cloudService'
import { Icon } from '@/components/Icon'
import { Calendar, Image as ImageIcon, Printer, RefreshCw, Trash2, X, Plus, Camera, Grid2x2, Loader } from 'lucide'

interface Props {
  projects: Project[]
  activeProject?: Project
  userId: string
  onSelectProject: (id: string) => void
  onPhotosAdded: (fileIDs: string[]) => void
  onPhotoDeleted: (index: number) => void
  onPhotoReplaced: (index: number, fileID: string) => void
}

const getAspectRatioClass = (ratio: PhotoAspectRatio): string => {
  switch (ratio) {
    case '16:9':
      return 'aspect-video'
    case '9:16':
      return 'aspect-[9/16]'
    case '4:3':
      return 'aspect-[4/3]'
    case '3:4':
      return 'aspect-[3/4]'
    default:
      return 'aspect-square'
  }
}

const GalleryView: React.FC<Props> = ({
  projects,
  activeProject,
  userId,
  onSelectProject,
  onPhotosAdded,
  onPhotoDeleted,
  onPhotoReplaced,
}) => {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [replacing, setReplacing] = useState(false)
  const [showExportCanvas, setShowExportCanvas] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 375, height: 600 })
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [loadingPhotos, setLoadingPhotos] = useState(false)
  const urlCacheRef = useRef<Record<string, string>>({})

  useEffect(() => {
    const photos = activeProject?.photos || []
    if (photos.length === 0) {
      setPhotoUrls({})
      return
    }

    const uncachedPhotos = photos.filter(p => !urlCacheRef.current[p])
    
    if (uncachedPhotos.length === 0) {
      const cached: Record<string, string> = {}
      photos.forEach(p => {
        cached[p] = urlCacheRef.current[p]
      })
      setPhotoUrls(cached)
      return
    }

    setLoadingPhotos(true)
    cloudService.getTempFileURLs(uncachedPhotos).then(urls => {
      uncachedPhotos.forEach((fileID, idx) => {
        urlCacheRef.current[fileID] = urls[idx] || fileID
      })
      
      const newPhotoUrls: Record<string, string> = {}
      photos.forEach(p => {
        newPhotoUrls[p] = urlCacheRef.current[p] || p
      })
      setPhotoUrls(newPhotoUrls)
      setLoadingPhotos(false)
    })
  }, [activeProject?.photos, activeProject?._id])

  const getProjectColor = (p: Project) =>
    p.colorBase.startsWith('#') ? p.colorBase : '#3b82f6'
  const themeColor = activeProject ? getProjectColor(activeProject) : '#ec4899'
  const aspectRatioClass = getAspectRatioClass(activeProject?.photoAspectRatio || '1:1')

  const handleExport = () => {
    if (!activeProject?.photos?.length) {
      Taro.showToast({ title: '暂无图片可导出', icon: 'none' })
      return
    }
    setShowExportModal(true)
  }

  const startExport = async (mode: 'polaroid' | 'tiled') => {
    setShowExportModal(false)
    Taro.showLoading({ title: '准备中...' })
    
    const photos = activeProject?.photos || []
    const tempUrls = await cloudService.getTempFileURLs(photos)
    
    if (mode === 'polaroid') {
      const canvasWidth = 375
      const padding = 12
      const gap = 12
      const headerHeight = 60
      const footerHeight = 30
      const cols = 2
      const cellWidth = (canvasWidth - padding * 2 - gap) / cols
      const photoWidth = cellWidth * 0.8
      const aspectRatio = getAspectRatioValue(activeProject?.photoAspectRatio || '1:1')
      const photoHeight = photoWidth / aspectRatio
      const rotationPadding = 20
      const cellHeight = photoHeight + rotationPadding
      const rows = Math.ceil(photos.length / cols)
      const height = headerHeight + padding + rows * cellHeight + (rows - 1) * gap + footerHeight
      setCanvasSize({ width: canvasWidth, height })
    } else {
      const cols = 4
      const rows = 4
      const photosPerPage = cols * rows
      const pageCount = Math.ceil(photos.length / photosPerPage)
      const width = 375
      const height = 530 * pageCount
      setCanvasSize({ width, height })
    }
    
    setShowExportCanvas(true)
    
    setTimeout(() => {
      Taro.showLoading({ title: '生成中...' })
      if (mode === 'polaroid') {
        drawPolaroidToCanvas(tempUrls)
      } else {
        drawTiledToCanvas(tempUrls)
      }
    }, 200)
  }

  const getAspectRatioValue = (ratio: PhotoAspectRatio): number => {
    switch (ratio) {
      case '16:9': return 16 / 9
      case '9:16': return 9 / 16
      case '4:3': return 4 / 3
      case '3:4': return 3 / 4
      default: return 1
    }
  }

  const roundRectPath = (
    ctx: any,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.arcTo(x + w, y, x + w, y + r, r)
    ctx.lineTo(x + w, y + h - r)
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
    ctx.lineTo(x + r, y + h)
    ctx.arcTo(x, y + h, x, y + h - r, r)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
  }

  const drawImageIcon = (ctx: any, x: number, y: number, size: number, color: string) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5
    const s = size / 24
    
    const rx = x + 3 * s, ry = y + 3 * s, rw = 18 * s, rh = 18 * s, rr = 2 * s
    ctx.beginPath()
    ctx.moveTo(rx + rr, ry)
    ctx.lineTo(rx + rw - rr, ry)
    ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr)
    ctx.lineTo(rx + rw, ry + rh - rr)
    ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr)
    ctx.lineTo(rx + rr, ry + rh)
    ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr)
    ctx.lineTo(rx, ry + rr)
    ctx.arcTo(rx, ry, rx + rr, ry, rr)
    ctx.closePath()
    ctx.stroke()
    
    ctx.beginPath()
    ctx.arc(x + 9 * s, y + 9 * s, 2.5 * s, 0, Math.PI * 2)
    ctx.fill()
    
    ctx.beginPath()
    ctx.moveTo(x + 21 * s, y + 15 * s)
    ctx.lineTo(x + 16 * s, y + 10 * s)
    ctx.lineTo(x + 12 * s, y + 14 * s)
    ctx.lineTo(x + 9 * s, y + 11 * s)
    ctx.lineTo(x + 3 * s, y + 17 * s)
    ctx.stroke()
  }

  const drawPolaroidToCanvas = async (photoUrls: string[]) => {
    if (photoUrls.length === 0) {
      Taro.hideLoading()
      setShowExportCanvas(false)
      return
    }

    const query = Taro.createSelectorQuery()
    query
      .select('#gallery-export-canvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res[0] || !res[0].node) {
          Taro.hideLoading()
          setShowExportCanvas(false)
          Taro.showToast({ title: '导出失败', icon: 'none' })
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const canvasWidth = 375
        const padding = 12
        const gridPadding = 12
        const gridGap = 12
        const tabHeight = 32
        const iconSize = 14
        const tabWidth = Math.min((activeProject?.name || 'Gallery').length * 12 + iconSize + 40, 140)
        const tabRadius = 8
        const footerHeight = 30
        const cols = 2
        const cellWidth = (canvasWidth - padding * 2 - gridGap) / cols
        const photoWidthRatio = 0.8
        const photoWidth = cellWidth * photoWidthRatio
        const aspectRatio = getAspectRatioValue(activeProject?.photoAspectRatio || '1:1')
        const photoHeight = photoWidth / aspectRatio
        const borderWidth = 3
        const rotationPadding = 20
        const cellHeight = photoHeight + rotationPadding
        const rows = Math.ceil(photoUrls.length / cols)
        
        const gridTop = padding + tabHeight
        const gridContentHeight = gridPadding * 2 + rows * cellHeight + (rows - 1) * gridGap
        const canvasHeight = gridTop + gridContentHeight + footerHeight
        const scale = 2

        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)

        ctx.fillStyle = '#f9fafb'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        ctx.fillStyle = themeColor
        ctx.beginPath()
        ctx.moveTo(padding + tabRadius, padding)
        ctx.lineTo(padding + tabWidth - tabRadius, padding)
        ctx.arcTo(padding + tabWidth, padding, padding + tabWidth, padding + tabRadius, tabRadius)
        ctx.lineTo(padding + tabWidth, padding + tabHeight)
        ctx.lineTo(padding, padding + tabHeight)
        ctx.lineTo(padding, padding + tabRadius)
        ctx.arcTo(padding, padding, padding + tabRadius, padding, tabRadius)
        ctx.closePath()
        ctx.fill()

        drawImageIcon(ctx, padding + 8, padding + 9, iconSize, '#ffffff')

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 12px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText((activeProject?.name || 'Gallery').slice(0, 10), padding + 8 + iconSize + 6, padding + 20)

        const gridArea = {
          x: padding,
          y: gridTop,
          w: canvasWidth - padding * 2,
          h: gridContentHeight
        }
        
        ctx.fillStyle = '#ffffff'
        ctx.beginPath()
        ctx.moveTo(gridArea.x + tabWidth, gridArea.y)
        ctx.lineTo(gridArea.x + gridArea.w - tabRadius, gridArea.y)
        ctx.arcTo(gridArea.x + gridArea.w, gridArea.y, gridArea.x + gridArea.w, gridArea.y + tabRadius, tabRadius)
        ctx.lineTo(gridArea.x + gridArea.w, gridArea.y + gridArea.h - tabRadius)
        ctx.arcTo(gridArea.x + gridArea.w, gridArea.y + gridArea.h, gridArea.x + gridArea.w - tabRadius, gridArea.y + gridArea.h, tabRadius)
        ctx.lineTo(gridArea.x + tabRadius, gridArea.y + gridArea.h)
        ctx.arcTo(gridArea.x, gridArea.y + gridArea.h, gridArea.x, gridArea.y + gridArea.h - tabRadius, tabRadius)
        ctx.lineTo(gridArea.x, gridArea.y)
        ctx.lineTo(gridArea.x + tabWidth, gridArea.y)
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(gridArea.x + tabWidth, gridArea.y)
        ctx.lineTo(gridArea.x + gridArea.w - tabRadius, gridArea.y)
        ctx.arcTo(gridArea.x + gridArea.w, gridArea.y, gridArea.x + gridArea.w, gridArea.y + tabRadius, tabRadius)
        ctx.lineTo(gridArea.x + gridArea.w, gridArea.y + gridArea.h - tabRadius)
        ctx.arcTo(gridArea.x + gridArea.w, gridArea.y + gridArea.h, gridArea.x + gridArea.w - tabRadius, gridArea.y + gridArea.h, tabRadius)
        ctx.lineTo(gridArea.x + tabRadius, gridArea.y + gridArea.h)
        ctx.arcTo(gridArea.x, gridArea.y + gridArea.h, gridArea.x, gridArea.y + gridArea.h - tabRadius, tabRadius)
        ctx.lineTo(gridArea.x, gridArea.y)
        ctx.stroke()

        ctx.strokeStyle = themeColor
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(gridArea.x, gridArea.y)
        ctx.lineTo(gridArea.x + tabWidth, gridArea.y)
        ctx.stroke()

        ctx.save()
        ctx.beginPath()
        ctx.rect(gridArea.x, gridArea.y, gridArea.w, gridArea.h)
        ctx.clip()
        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 0.5
        const gridLineSize = 15
        for (let i = 0; i <= gridArea.h / gridLineSize; i++) {
          ctx.beginPath()
          ctx.moveTo(gridArea.x, gridArea.y + i * gridLineSize)
          ctx.lineTo(gridArea.x + gridArea.w, gridArea.y + i * gridLineSize)
          ctx.stroke()
        }
        for (let i = 0; i <= gridArea.w / gridLineSize; i++) {
          ctx.beginPath()
          ctx.moveTo(gridArea.x + i * gridLineSize, gridArea.y)
          ctx.lineTo(gridArea.x + i * gridLineSize, gridArea.y + gridArea.h)
          ctx.stroke()
        }
        ctx.restore()

        const loadImage = (src: string): Promise<any> => {
          return new Promise((resolve) => {
            const img = canvas.createImage()
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
            img.src = src
          })
        }

        const startY = gridTop + gridPadding
        
        for (let i = 0; i < photoUrls.length; i++) {
          const col = i % cols
          const row = Math.floor(i / cols)
          const cellCenterX = padding + gridPadding + col * (cellWidth + gridGap) + cellWidth / 2 - gridPadding
          const cellCenterY = startY + row * (cellHeight + gridGap) + cellHeight / 2
          
          const rotation = (i % 3 === 0 ? -2 : i % 3 === 1 ? 2 : 0) * Math.PI / 180
          
          ctx.save()
          ctx.translate(cellCenterX, cellCenterY)
          ctx.rotate(rotation)

          const frameWidth = photoWidth + borderWidth * 2
          const frameHeight = photoHeight + borderWidth * 2
          const frameX = -frameWidth / 2
          const frameY = -frameHeight / 2

          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = 'rgba(0,0,0,0.15)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetX = 0
          ctx.shadowOffsetY = 2
          roundRectPath(ctx, frameX, frameY, frameWidth, frameHeight, 8)
          ctx.fill()
          ctx.shadowColor = 'transparent'

          const img = await loadImage(photoUrls[i])
          if (img) {
            const imgX = frameX + borderWidth
            const imgY = frameY + borderWidth
            ctx.save()
            roundRectPath(ctx, imgX, imgY, photoWidth, photoHeight, 5)
            ctx.clip()
            
            const imgRatio = img.width / img.height
            let drawW = photoWidth
            let drawH = photoHeight
            let drawX = imgX
            let drawY = imgY
            if (imgRatio > aspectRatio) {
              drawW = photoHeight * imgRatio
              drawX = imgX - (drawW - photoWidth) / 2
            } else {
              drawH = photoWidth / imgRatio
              drawY = imgY - (drawH - photoHeight) / 2
            }
            ctx.drawImage(img, drawX, drawY, drawW, drawH)
            ctx.restore()
          }
          
          ctx.restore()
        }

        ctx.fillStyle = '#9ca3af'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('点滴手帐 · every drop counts', canvasWidth - padding, canvasHeight - 10)

        Taro.canvasToTempFilePath({
          canvas,
          fileType: 'jpg',
          quality: 1,
          success: (result) => {
            Taro.hideLoading()
            setShowExportCanvas(false)
            Taro.saveImageToPhotosAlbum({
              filePath: result.tempFilePath,
              success: () => {
                Taro.showToast({ title: '已保存到相册', icon: 'success' })
              },
              fail: () => {
                Taro.previewImage({ urls: [result.tempFilePath] })
              },
            })
          },
          fail: () => {
            Taro.hideLoading()
            setShowExportCanvas(false)
            Taro.showToast({ title: '导出失败', icon: 'none' })
          },
        })
      })
  }

  const drawTiledToCanvas = async (photoUrls: string[]) => {
    if (photoUrls.length === 0) {
      Taro.hideLoading()
      setShowExportCanvas(false)
      return
    }

    const query = Taro.createSelectorQuery()
    query
      .select('#gallery-export-canvas')
      .fields({ node: true, size: true })
      .exec(async (res) => {
        if (!res[0] || !res[0].node) {
          Taro.hideLoading()
          setShowExportCanvas(false)
          Taro.showToast({ title: '导出失败', icon: 'none' })
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const cols = 4
        const rows = 4
        const photosPerPage = cols * rows
        const pageCount = Math.ceil(photoUrls.length / photosPerPage)
        
        const pageWidth = 375
        const pageHeight = 530
        const margin = 12
        const gap = 6
        const cellWidth = (pageWidth - margin * 2 - gap * (cols - 1)) / cols
        const cellHeight = (pageHeight - margin * 2 - gap * (rows - 1)) / rows
        const scale = 2

        const totalHeight = pageHeight * pageCount
        canvas.width = pageWidth * scale
        canvas.height = totalHeight * scale
        ctx.scale(scale, scale)

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, pageWidth, totalHeight)

        const loadImage = (src: string): Promise<any> => {
          return new Promise((resolve) => {
            const img = canvas.createImage()
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
            img.src = src
          })
        }

        for (let i = 0; i < photoUrls.length; i++) {
          const pageIndex = Math.floor(i / photosPerPage)
          const indexInPage = i % photosPerPage
          const col = indexInPage % cols
          const row = Math.floor(indexInPage / cols)

          const pageOffsetY = pageIndex * pageHeight
          const cellX = margin + col * (cellWidth + gap)
          const cellY = pageOffsetY + margin + row * (cellHeight + gap)

          const img = await loadImage(photoUrls[i])
          if (img) {
            const imgRatio = img.width / img.height
            const cellRatio = cellWidth / cellHeight

            let drawWidth, drawHeight, drawX, drawY
            if (imgRatio > cellRatio) {
              drawWidth = cellWidth
              drawHeight = cellWidth / imgRatio
              drawX = cellX
              drawY = cellY + (cellHeight - drawHeight) / 2
            } else {
              drawHeight = cellHeight
              drawWidth = cellHeight * imgRatio
              drawX = cellX + (cellWidth - drawWidth) / 2
              drawY = cellY
            }
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
          }
        }

        Taro.canvasToTempFilePath({
          canvas,
          fileType: 'jpg',
          quality: 1,
          success: (result) => {
            Taro.hideLoading()
            setShowExportCanvas(false)
            Taro.saveImageToPhotosAlbum({
              filePath: result.tempFilePath,
              success: () => {
                Taro.showToast({ title: '已保存到相册', icon: 'success' })
              },
              fail: () => {
                Taro.previewImage({ urls: [result.tempFilePath] })
              },
            })
          },
          fail: () => {
            Taro.hideLoading()
            setShowExportCanvas(false)
            Taro.showToast({ title: '导出失败', icon: 'none' })
          },
        })
      })
  }

  const handleChooseImage = async () => {
    if (!activeProject) return

    try {
      const res = await Taro.chooseImage({
        count: 9,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setUploading(true)
        const uploadedFileIDs: string[] = []
        
        for (const tempPath of res.tempFilePaths) {
          const fileID = await cloudService.uploadPhoto(
            userId,
            activeProject._id || activeProject.id,
            tempPath
          )
          if (fileID) {
            await cloudService.addPhotoToProject(activeProject._id || activeProject.id, fileID)
            uploadedFileIDs.push(fileID)
          }
        }
        
        if (uploadedFileIDs.length > 0) {
          onPhotosAdded(uploadedFileIDs)
        }
        setUploading(false)
      }
    } catch (error) {
      console.error('Choose image error:', error)
      setUploading(false)
    }
  }

  const handleDeletePhoto = async () => {
    if (editingPhotoIndex === null || !activeProject) return

    const photos = activeProject.photos || []
    const fileID = photos[editingPhotoIndex]
    if (fileID) {
      await cloudService.removePhotoFromProject(
        activeProject._id || activeProject.id,
        editingPhotoIndex,
        fileID
      )
      onPhotoDeleted(editingPhotoIndex)
    }
    setEditingPhotoIndex(null)
  }

  const handleReplacePhoto = async () => {
    if (editingPhotoIndex === null || !activeProject) return

    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        setReplacing(true)
        const newFileID = await cloudService.uploadPhoto(
          userId,
          activeProject._id || activeProject.id,
          res.tempFilePaths[0]
        )
        if (newFileID) {
          const oldFileID = activeProject.photos?.[editingPhotoIndex]
          if (oldFileID) {
            await cloudService.deletePhoto(oldFileID)
          }
          onPhotoReplaced(editingPhotoIndex, newFileID)
        }
        setReplacing(false)
        setEditingPhotoIndex(null)
      }
    } catch (error) {
      console.error('Replace image error:', error)
      setReplacing(false)
    }
  }

  if (projects.length === 0) {
    return (
      <View className="flex flex-col items-center justify-center py-20 text-center space-y-4 px-6">
        <View className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon icon={Camera} size={40} color="#d1d5db" />
        </View>
        <Text className="text-xl font-bold text-gray-700">No Photo Journals yet</Text>
        <Text className="text-sm text-gray-400">
          Add a new project and select "Photo Journal" mode to start collecting memories!
        </Text>
      </View>
    )
  }

  return (
    <View className="flex flex-col h-full w-full bg-gray-50 dark:bg-background">
      <View className="relative flex-1 flex flex-col min-h-0 w-full">
        <ScrollView scrollX className="shrink-0 relative z-10 w-full">
          <View className="flex gap-1 px-1">
            {projects.map((p) => {
              const pColor = getProjectColor(p)
              const isActive = activeProject?._id === p._id || activeProject?.id === p.id
              return (
                <View
                  key={p._id || p.id}
                  onClick={() => onSelectProject(p._id || p.id)}
                  className={`px-3 py-1.5 text-sm font-bold whitespace-nowrap transition-all flex items-center gap-1.5 rounded-t-lg border-t border-l border-r ${
                    isActive
                      ? 'text-white -mb-px relative z-20'
                      : 'bg-gray-100 text-gray-400 border-gray-200'
                  }`}
                  style={
                    isActive
                      ? {
                          backgroundColor: pColor,
                          borderColor: pColor,
                        }
                      : {}
                  }
                >
                  <Icon
                    icon={p.mode === 'gallery' ? ImageIcon : Calendar}
                    size={14}
                    color={isActive ? '#ffffff' : '#9ca3af'}
                  />
                  <Text>{p.name}</Text>
                </View>
              )
            })}
          </View>
        </ScrollView>

        <ScrollView
          scrollY
          enhanced
          showScrollbar={false}
          className="grid-paper border border-gray-200 rounded-lg rounded-tl-none p-3 pt-4 card-shadow w-full box-border"
          style={{ borderTopColor: themeColor, flex: 1, height: '100%' }}
        >
          <View className="flex justify-end mb-2 pr-1">
            <View
              onClick={handleExport}
              className="w-6 h-6 flex items-center justify-center"
            >
              <Icon icon={Printer} size={16} color={themeColor} />
            </View>
          </View>
          <View className="grid grid-cols-2 gap-3">
            {loadingPhotos && activeProject?.photos?.length ? (
              <View className="col-span-2 flex items-center justify-center py-8">
                <Icon icon={Loader} size={24} color="#9ca3af" />
              </View>
            ) : (
              activeProject?.photos?.map((photo, i) => (
                <View
                  key={photo}
                  className="flex items-center justify-center"
                >
                  <View
                    onClick={() => setEditingPhotoIndex(i)}
                    className={`${aspectRatioClass} w-[80%] bg-white rounded-lg border-[3px] border-white shadow overflow-hidden relative`}
                    style={{
                      transform: `rotate(${i % 3 === 0 ? -2 : i % 3 === 1 ? 2 : 0}deg)`,
                    }}
                  >
                    <Image src={photoUrls[photo] || photo} mode="aspectFill" className="w-full h-full" />
                  </View>
                </View>
              ))
            )}

            <View className="flex items-center justify-center">
              <View
                onClick={handleChooseImage}
                className={`${aspectRatioClass} w-[80%] bg-white/50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-1`}
              >
                {uploading ? (
                  <Icon icon={Loader} size={20} color="#9ca3af" />
                ) : (
                  <>
                    <View className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <Icon icon={Plus} size={18} color="#9ca3af" />
                    </View>
                    <Text className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">
                      New Moment
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {activeProject?.photos?.length === 0 && (
            <View className="flex flex-col items-center justify-center py-12 text-center">
              <Text className="text-sm text-gray-300 italic">
                No photos in this album yet. Upload your first achievement!
              </Text>
            </View>
          )}
        </ScrollView>
      </View>

      {editingPhotoIndex !== null && activeProject?.photos?.[editingPhotoIndex] && (
        <View
          className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50"
          onClick={() => setEditingPhotoIndex(null)}
        >
          <View 
            className="w-[90%] max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photoUrls[activeProject.photos[editingPhotoIndex]] || activeProject.photos[editingPhotoIndex]}
              mode="widthFix"
              className="w-full rounded-lg"
            />
          </View>

          <View 
            className="absolute bottom-12 left-0 right-0 flex justify-center gap-8"
            onClick={(e) => e.stopPropagation()}
          >
            <View
              onClick={handleReplacePhoto}
              className="flex flex-col items-center gap-2"
            >
              <View className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                {replacing ? (
                  <Icon icon={Loader} size={24} color="#ffffff" />
                ) : (
                  <Icon icon={RefreshCw} size={24} color="#ffffff" />
                )}
              </View>
              <Text className="text-white text-xs">替换</Text>
            </View>
            <View
              onClick={handleDeletePhoto}
              className="flex flex-col items-center gap-2"
            >
              <View className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                <Icon icon={Trash2} size={24} color="#ffffff" />
              </View>
              <Text className="text-white text-xs">删除</Text>
            </View>
          </View>

          <View
            onClick={() => setEditingPhotoIndex(null)}
            className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
          >
            <Icon icon={X} size={20} color="#ffffff" />
          </View>
        </View>
      )}

      {showExportModal && (
        <View
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowExportModal(false)}
        >
          <View
            className="bg-white rounded-2xl p-5 mx-4 w-full max-w-xs shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-gray-700 mb-4 text-center block">
              选择导出方式
            </Text>

            <View className="space-y-3">
              <View
                onClick={() => startExport('polaroid')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 text-left"
              >
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Icon icon={ImageIcon} size={20} color="#ec4899" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-700 block">宝丽来照片墙</Text>
                    <Text className="text-xs text-gray-400">按页面样式导出</Text>
                  </View>
                </View>
              </View>

              <View
                onClick={() => startExport('tiled')}
                className="w-full p-4 rounded-xl border-2 border-gray-200 text-left"
              >
                <View className="flex items-center gap-3">
                  <View className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Icon icon={Grid2x2} size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text className="font-bold text-gray-700 block">平铺打印</Text>
                    <Text className="text-xs text-gray-400">4×4 网格，适合打印</Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              onClick={() => setShowExportModal(false)}
              className="w-full mt-4 py-2 text-sm text-gray-400 text-center"
            >
              <Text>取消</Text>
            </View>
          </View>
        </View>
      )}

      {showExportCanvas && (
        <Canvas
          type="2d"
          id="gallery-export-canvas"
          style={{ position: 'fixed', left: '-9999px', width: `${canvasSize.width}px`, height: `${canvasSize.height}px` }}
        />
      )}
    </View>
  )
}

export default GalleryView
