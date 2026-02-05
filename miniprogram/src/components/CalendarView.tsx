import { View, Text, ScrollView, Canvas } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useMemo, useState, useRef, useEffect } from 'react'
import { Project } from '@/types'
import { generateColorLevels, getColorForLevel } from '@/utils/colors'
import { Icon } from '@/components/Icon'
import { Calendar, Image as ImageIcon, Printer } from 'lucide'

interface Props {
  projects: Project[]
  activeProject: Project
  onSelectProject: (id: string) => void
  onLog: (date?: string) => void
  onUpdateLog: (date: string, count: number) => void
}

const CalendarView: React.FC<Props> = ({
  projects,
  activeProject,
  onSelectProject,
  onLog,
  onUpdateLog,
}) => {
  const currentYear = new Date().getFullYear()
  const today = new Date().toISOString().split('T')[0]
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  const [selectedDate, setSelectedDate] = useState<string | null>(today)

  const [editingDate, setEditingDate] = useState<string | null>(null)
  const [editCount, setEditCount] = useState<number>(0)

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  useEffect(() => {
    setSelectedDate(today)
  }, [activeProject._id, activeProject.id, today])

  const themeColor = activeProject.colorBase.startsWith('#')
    ? activeProject.colorBase
    : '#3b82f6'
  const selectedDateCount = selectedDate
    ? activeProject.logs[selectedDate] || 0
    : activeProject.logs[today] || 0
  const checkInLevels = activeProject.checkInLevels || [1, 2, 3, 4, 5]
  const checkInShape = activeProject.checkInShape || 'square'

  const colorLevels = useMemo(() => generateColorLevels(themeColor), [themeColor])

  const getProjectColor = (p: Project) =>
    p.colorBase.startsWith('#') ? p.colorBase : '#3b82f6'

  const isValidDate = (month: number, day: number) => {
    const d = new Date(currentYear, month - 1, day)
    return d.getMonth() === month - 1
  }

  const getCheckInCount = (month: number, day: number): number | null => {
    if (!isValidDate(month, day)) return null
    const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return activeProject.logs[dateStr] || 0
  }

  const openEditModal = (dateStr: string) => {
    const count = activeProject.logs[dateStr] || 0
    setEditingDate(dateStr)
    setEditCount(count)
  }

  const handleCellTouchStart = (dateStr: string) => {
    longPressTriggered.current = false
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      Taro.vibrateShort({ type: 'light' })
      openEditModal(dateStr)
    }, 400)
  }

  const handleCellTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const handleCellClick = (dateStr: string, isSelected: boolean) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false
      return
    }
    setSelectedDate(isSelected ? null : dateStr)
  }

  const handleSaveEdit = () => {
    if (editingDate) {
      onUpdateLog(editingDate, editCount)
      setEditingDate(null)
    }
  }

  const [showExportCanvas, setShowExportCanvas] = useState(false)

  const handleExport = () => {
    setShowExportCanvas(true)
    Taro.showLoading({ title: '生成中...' })
    setTimeout(() => {
      drawCalendarToCanvas()
    }, 150)
  }

  const drawRoundRect = (
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
    ctx.lineTo(x + w, y + h)
    ctx.lineTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.arcTo(x, y, x + r, y, r)
    ctx.closePath()
    ctx.fill()
  }

  const drawCalendarIcon = (ctx: any, x: number, y: number, size: number, color: string) => {
    ctx.strokeStyle = color
    ctx.fillStyle = color
    ctx.lineWidth = 1.5
    const s = size / 24
    
    const rx = x + 3 * s, ry = y + 4 * s, rw = 18 * s, rh = 18 * s, rr = 2 * s
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
    ctx.moveTo(x + 8 * s, y + 2 * s)
    ctx.lineTo(x + 8 * s, y + 6 * s)
    ctx.moveTo(x + 16 * s, y + 2 * s)
    ctx.lineTo(x + 16 * s, y + 6 * s)
    ctx.moveTo(x + 3 * s, y + 10 * s)
    ctx.lineTo(x + 21 * s, y + 10 * s)
    ctx.stroke()
  }

  const drawCalendarToCanvas = () => {
    const query = Taro.createSelectorQuery()
    query
      .select('#export-canvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0] || !res[0].node) {
          Taro.hideLoading()
          setShowExportCanvas(false)
          Taro.showToast({ title: '导出失败', icon: 'none' })
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')

        const cellSize = 22
        const cellGap = 3
        const dateColWidth = 28
        const padding = 24
        const tabHeight = 28
        const monthRowHeight = 18
        const monthToGridGap = 8
        const cardPaddingTop = 14
        const cardPaddingBottom = 18
        const cardPaddingLR = 16
        const footerHeight = 32

        const calendarGridWidth = dateColWidth + 12 * (cellSize + cellGap) - cellGap
        const calendarGridHeight = 31 * (cellSize + cellGap) - cellGap

        const cardWidth = calendarGridWidth + cardPaddingLR * 2 + 10
        const cardContentHeight = monthRowHeight + monthToGridGap + calendarGridHeight
        const cardHeight = cardPaddingTop + cardContentHeight + cardPaddingBottom + 45

        const canvasWidth = padding * 2 + cardWidth
        const canvasHeight = padding + tabHeight + cardHeight + footerHeight
        const scale = 2

        canvas.width = canvasWidth * scale
        canvas.height = canvasHeight * scale
        ctx.scale(scale, scale)

        ctx.fillStyle = '#f9fafb'
        ctx.fillRect(0, 0, canvasWidth, canvasHeight)

        const tabY = padding
        const iconSize = 14
        const tabWidth = Math.min(activeProject.name.length * 12 + iconSize + 40, 140)

        ctx.fillStyle = themeColor
        drawRoundRect(ctx, padding, tabY, tabWidth, tabHeight, 6)

        drawCalendarIcon(ctx, padding + 8, tabY + 7, iconSize, '#ffffff')

        ctx.fillStyle = '#ffffff'
        ctx.font = 'bold 13px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(activeProject.name.slice(0, 10), padding + 8 + iconSize + 6, tabY + 18)

        const legendStartX = padding + tabWidth + 12
        colorLevels.forEach((c, i) => {
          ctx.fillStyle = c
          const lx = legendStartX + i * 16
          const ly = tabY + 7
          if (checkInShape === 'circle') {
            ctx.beginPath()
            ctx.arc(lx + 6, ly + 6, 6, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(lx, ly, 12, 12)
          }
        })

        const cardTop = tabY + tabHeight - 1
        const cardLeft = padding

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(cardLeft, cardTop, cardWidth, cardHeight)

        ctx.fillStyle = themeColor
        ctx.fillRect(cardLeft, cardTop, tabWidth, 3)

        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 1
        ctx.strokeRect(cardLeft, cardTop, cardWidth, cardHeight)

        ctx.strokeStyle = '#e5e7eb'
        ctx.lineWidth = 0.5
        const gridLineSize = 15
        for (let y = cardTop; y < cardTop + cardHeight; y += gridLineSize) {
          ctx.beginPath()
          ctx.moveTo(cardLeft, y)
          ctx.lineTo(cardLeft + cardWidth, y)
          ctx.stroke()
        }
        for (let x = cardLeft; x < cardLeft + cardWidth; x += gridLineSize) {
          ctx.beginPath()
          ctx.moveTo(x, cardTop)
          ctx.lineTo(x, cardTop + cardHeight)
          ctx.stroke()
        }

        const calendarLeft = cardLeft + cardPaddingLR
        const calendarTop = cardTop + cardPaddingTop

        ctx.fillStyle = '#9ca3af'
        ctx.font = 'bold 11px sans-serif'
        ctx.textAlign = 'left'
        ctx.fillText(String(currentYear), calendarLeft, calendarTop + 12)

        months.forEach((m, mi) => {
          ctx.fillStyle = '#9ca3af'
          ctx.font = 'bold 10px sans-serif'
          ctx.textAlign = 'center'
          const mx = calendarLeft + dateColWidth + mi * (cellSize + cellGap) + cellSize / 2
          ctx.fillText(`${m}月`, mx, calendarTop + 12)
        })

        const gridStartY = calendarTop + monthRowHeight + monthToGridGap

        days.forEach((d) => {
          if (d === 1 || d % 5 === 0) {
            ctx.fillStyle = '#d1d5db'
            ctx.font = 'bold 9px sans-serif'
            ctx.textAlign = 'right'
            const dy = gridStartY + (d - 1) * (cellSize + cellGap) + cellSize / 2 + 3
            ctx.fillText(String(d), calendarLeft + dateColWidth - 6, dy)
          }
        })

        months.forEach((month, mi) => {
          days.forEach((day) => {
            const count = getCheckInCount(month, day)
            if (count === null) return

            const x = calendarLeft + dateColWidth + mi * (cellSize + cellGap)
            const y = gridStartY + (day - 1) * (cellSize + cellGap)

            if (count > 0) {
              ctx.fillStyle = getColorForLevel(count, checkInLevels, colorLevels)
            } else {
              ctx.fillStyle = 'rgba(0,0,0,0.03)'
            }

            if (checkInShape === 'circle') {
              ctx.beginPath()
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize / 2, 0, Math.PI * 2)
              ctx.fill()
            } else {
              ctx.fillRect(x, y, cellSize, cellSize)
            }
          })
        })

        ctx.fillStyle = '#d1d5db'
        ctx.font = 'bold 10px sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText('点滴手帐 · every drop counts', canvasWidth - padding, canvasHeight - 12)

        Taro.canvasToTempFilePath({
          canvas,
          fileType: 'png',
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

  return (
    <View className="flex flex-col h-full">
      <View className="relative flex-1 flex flex-col min-h-0">
        <ScrollView scrollX className="shrink-0 relative z-10">
          <View className="flex gap-1 px-1">
            {projects.map((p) => {
              const pColor = getProjectColor(p)
              const isActive = activeProject._id === p._id || activeProject.id === p.id
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

        <View
          id="calendar-container"
          className="grid-paper border border-gray-200 rounded-lg rounded-tl-none p-3 pt-4 flex-1 flex flex-col min-h-0 card-shadow"
          style={{ borderTopColor: themeColor }}
        >
          <View className="flex items-center mb-1">
            <View className="w-6 text-[10px] font-bold text-gray-400">{currentYear}</View>
            <View className="flex-1 grid grid-cols-12">
              {months.map((m) => (
                <View key={m} className="text-[9px] font-bold text-gray-400 text-center">
                  {m}月
                </View>
              ))}
            </View>
            <View
              onClick={handleExport}
              className="w-6 h-6 flex items-center justify-center"
            >
              <Icon icon={Printer} size={16} color={themeColor} />
            </View>
          </View>

          <ScrollView scrollY className="flex-1 min-h-0">
            <View
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: '16px repeat(12, 1fr)',
                gridTemplateRows: 'repeat(31, minmax(0, 1fr))',
              }}
            >
              {days.map((d) => (
                <View
                  key={`date-${d}`}
                  className="flex items-center justify-end pr-0.5 text-[8px] font-bold text-gray-300"
                  style={{ gridColumn: 1, gridRow: d }}
                >
                  {d === 1 || d % 5 === 0 ? d : ''}
                </View>
              ))}

              {months.map((month, monthIdx) =>
                days.map((day) => {
                  const count = getCheckInCount(month, day)
                  const isInvalid = count === null
                  const dateStr = `${currentYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isSelected = selectedDate === dateStr
                  const isToday = dateStr === today
                  const cellColor =
                    count !== null && count > 0
                      ? getColorForLevel(count, checkInLevels, colorLevels)
                      : null

                  return (
                    <View
                      key={`${month}-${day}`}
                      onClick={() => {
                        if (!isInvalid) {
                          handleCellClick(dateStr, isSelected)
                        }
                      }}
                      onTouchStart={() => !isInvalid && handleCellTouchStart(dateStr)}
                      onTouchEnd={handleCellTouchEnd}
                      onTouchCancel={handleCellTouchEnd}
                      className={`aspect-square transition-all ${
                        isInvalid ? 'opacity-0 pointer-events-none' : ''
                      } ${checkInShape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
                      style={{
                        gridColumn: monthIdx + 2,
                        gridRow: day,
                        backgroundColor: cellColor || 'rgba(0,0,0,0.03)',
                        boxShadow: isSelected
                          ? `0 0 0 2px ${themeColor}`
                          : isToday
                            ? '0 0 0 1px rgba(0,0,0,0.2)'
                            : 'none',
                        transform: isSelected ? 'scale(1.1)' : 'none',
                        zIndex: isSelected ? 10 : 1,
                      }}
                    />
                  )
                })
              )}
            </View>
          </ScrollView>

          <View className="mt-3 pt-3 border-t border-gray-200 shrink-0">
            <View className="flex items-center justify-between mb-2">
              <View className="flex items-center gap-1">
                {colorLevels.map((c, i) => (
                  <View
                    key={i}
                    className={`w-4 h-4 ${checkInShape === 'circle' ? 'rounded-full' : 'rounded-[2px]'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </View>
              {selectedDateCount > 0 && (
                <Text className="text-xs text-gray-400">
                  {selectedDate
                    ? `${selectedDate.slice(5).replace('-', '/')}: ${selectedDateCount}次`
                    : `今日: ${selectedDateCount}次`}
                </Text>
              )}
            </View>
            <View
              onClick={() => {
                const dateToLog = selectedDate || today
                onLog(dateToLog)
              }}
              className="w-full py-2.5 rounded-xl font-bold text-sm transition-all text-white shadow-sm text-center active:scale-[0.98]"
              style={{ backgroundColor: themeColor }}
            >
              {selectedDate
                ? `${selectedDate.slice(5).replace('-', '/')} 打卡 +1`
                : '今日打卡 +1'}
            </View>
          </View>
        </View>
      </View>

      {editingDate && (
        <View
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingDate(null)}
        >
          <View
            className="bg-white rounded-2xl p-5 w-72 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Text className="text-lg font-bold text-center mb-4 block">
              修改 {editingDate.slice(5).replace('-', '/')} 打卡
            </Text>
            <View className="flex items-center justify-center gap-4 mb-5">
              <View
                onClick={() => setEditCount(Math.max(0, editCount - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 flex items-center justify-center active:bg-gray-200"
              >
                <Text>−</Text>
              </View>
              <Text
                className="text-3xl font-bold w-16 text-center"
                style={{ color: themeColor }}
              >
                {editCount}
              </Text>
              <View
                onClick={() => setEditCount(editCount + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 text-xl font-bold text-gray-600 flex items-center justify-center active:bg-gray-200"
              >
                <Text>+</Text>
              </View>
            </View>
            <View className="flex gap-2">
              <View
                onClick={() => setEditingDate(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 text-center active:bg-gray-200"
              >
                <Text>取消</Text>
              </View>
              <View
                onClick={handleSaveEdit}
                className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white text-center active:opacity-90"
                style={{ backgroundColor: themeColor }}
              >
                <Text>保存</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {showExportCanvas && (
        <Canvas
          type="2d"
          id="export-canvas"
          style={{ position: 'fixed', left: '-9999px', width: '450px', height: '950px' }}
        />
      )}
    </View>
  )
}

export default CalendarView
