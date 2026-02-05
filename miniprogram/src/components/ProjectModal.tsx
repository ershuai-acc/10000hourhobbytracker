import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState, useEffect } from 'react'
import { Project, ProjectMode, PhotoAspectRatio, CheckInShape } from '@/types'
import { Icon } from '@/components/Icon'
import { Calendar, Image as ImageIcon, Check, ChevronDown, ChevronRight } from 'lucide'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Project>) => void
  onDelete: (id: string) => void
  editingProject: Project | null
}

const DEFAULT_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#f43f5e']

const ASPECT_RATIOS: { value: PhotoAspectRatio; label: string; width: number; height: number }[] = [
  { value: '1:1', label: '1:1', width: 1, height: 1 },
  { value: '16:9', label: '16:9', width: 16, height: 9 },
  { value: '9:16', label: '9:16', width: 9, height: 16 },
  { value: '4:3', label: '4:3', width: 4, height: 3 },
  { value: '3:4', label: '3:4', width: 3, height: 4 },
]

const ProjectModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  editingProject,
}) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [mode, setMode] = useState<ProjectMode>('calendar')
  const [color, setColor] = useState('#3b82f6')
  const [goal, setGoal] = useState(10000)
  const [hoursPerCheckIn, setHoursPerCheckIn] = useState(1)
  const [checkInLevels, setCheckInLevels] = useState<number[]>([1, 2, 3, 4, 5])
  const [checkInShape, setCheckInShape] = useState<CheckInShape>('square')
  const [aspectRatio, setAspectRatio] = useState<PhotoAspectRatio>('1:1')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen) {
      if (editingProject) {
        setName(editingProject.name)
        setDescription(editingProject.description || '')
        setMode(editingProject.mode || 'calendar')
        setColor(
          editingProject.colorBase.startsWith('#') ? editingProject.colorBase : '#3b82f6'
        )
        setGoal(editingProject.goalHours)
        setHoursPerCheckIn(editingProject.hoursPerCheckIn || 1)
        setCheckInLevels(editingProject.checkInLevels || [1, 2, 3, 4, 5])
        setCheckInShape(editingProject.checkInShape || 'square')
        setAspectRatio(editingProject.photoAspectRatio || '1:1')
        setShowAdvanced(false)
      } else {
        setName('')
        setDescription('')
        setMode('calendar')
        setColor('#3b82f6')
        setGoal(10000)
        setHoursPerCheckIn(1)
        setCheckInLevels([1, 2, 3, 4, 5])
        setCheckInShape('square')
        setAspectRatio('1:1')
        setShowAdvanced(false)
      }
      setShowDeleteConfirm(false)
    }
  }, [editingProject, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave({
      name,
      description,
      mode,
      colorBase: color,
      goalHours: goal,
      hoursPerCheckIn,
      checkInLevels,
      checkInShape,
      photoAspectRatio: aspectRatio,
    })
  }

  const handleDelete = () => {
    if (editingProject) {
      onDelete(editingProject._id || editingProject.id)
      onClose()
    }
  }

  return (
    <View
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40"
      onClick={onClose}
    >
      <View
        className="bg-white rounded-2xl w-full max-w-xs overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <ScrollView scrollY className="max-h-[75vh]">
          <View className="p-4 space-y-3">
            <View className="text-center">
              <Text className="text-lg font-bold text-gray-800 block">
                {editingProject ? '编辑项目' : '新建项目'}
              </Text>
              <Text className="text-xs text-gray-400">选择记录方式</Text>
            </View>

            <View className="space-y-3">
              <View className="space-y-1">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                  名称
                </Text>
                <Input
                  value={name}
                  onInput={(e) => setName(e.detail.value)}
                  placeholder="如：钢琴、编程、健身..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                />
              </View>

              <View className="space-y-1">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                  备注
                </Text>
                <Input
                  value={description}
                  onInput={(e) => setDescription(e.detail.value)}
                  placeholder="添加备注..."
                  className="w-full px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                />
              </View>

              <View className="space-y-1">
                <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                  记录方式
                </Text>
                <View className="grid grid-cols-2 bg-gray-50 p-1 rounded-xl gap-1">
                  <View
                    onClick={() => setMode('calendar')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                      mode === 'calendar'
                        ? 'bg-white text-blue-500 shadow-sm'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon icon={Calendar} size={20} color={mode === 'calendar' ? '#3b82f6' : '#9ca3af'} />
                    <Text className="text-xs">日历打卡</Text>
                  </View>
                  <View
                    onClick={() => setMode('gallery')}
                    className={`py-2 px-2 text-xs font-bold rounded-lg transition-all flex flex-col items-center gap-1 ${
                      mode === 'gallery'
                        ? 'bg-white text-rose-500 shadow-sm'
                        : 'text-gray-400'
                    }`}
                  >
                    <Icon icon={ImageIcon} size={20} color={mode === 'gallery' ? '#f43f5e' : '#9ca3af'} />
                    <Text className="text-xs">图片记录</Text>
                  </View>
                </View>
              </View>

              {mode === 'calendar' && (
                <>
                  <View className="space-y-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      目标时长
                    </Text>
                    <View className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={String(goal)}
                        onInput={(e) => setGoal(Number(e.detail.value))}
                        className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                      />
                      <Text className="text-gray-400 text-sm">小时</Text>
                    </View>
                  </View>

                  <View className="space-y-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      单次打卡时长
                    </Text>
                    <View className="flex items-center gap-2">
                      <Input
                        type="digit"
                        value={String(hoursPerCheckIn)}
                        onInput={(e) => setHoursPerCheckIn(Number(e.detail.value))}
                        className="flex-1 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm"
                      />
                      <Text className="text-gray-400 text-sm">小时</Text>
                    </View>
                  </View>

                  <View
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-gray-400 pl-1"
                  >
                    <Icon icon={showAdvanced ? ChevronDown : ChevronRight} size={14} color="#9ca3af" />
                    <Text>更多设置</Text>
                  </View>

                  {showAdvanced && (
                    <View className="space-y-3 pl-2 border-l-2 border-gray-100">
                      <View className="space-y-1">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                          主题颜色
                        </Text>
                        <View className="flex items-center gap-1.5 flex-wrap">
                          {DEFAULT_COLORS.map((c) => (
                            <View
                              key={c}
                              onClick={() => setColor(c)}
                              className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                                color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                              }`}
                              style={{ backgroundColor: c }}
                            >
                              {color === c && <Icon icon={Check} size={16} color="#ffffff" strokeWidth={3} />}
                            </View>
                          ))}
                        </View>
                      </View>

                      <View className="space-y-1">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                          打卡形状
                        </Text>
                        <View className="flex items-center gap-2">
                          <View
                            onClick={() => setCheckInShape('square')}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
                              checkInShape === 'square' ? 'bg-gray-100 ring-1 ring-gray-300' : ''
                            }`}
                          >
                            <View
                              className={`w-4 h-4 rounded-[2px] ${checkInShape === 'square' ? 'bg-gray-500' : 'bg-gray-300'}`}
                            />
                            <Text
                              className={`text-xs font-bold ${checkInShape === 'square' ? 'text-gray-700' : 'text-gray-400'}`}
                            >
                              方形
                            </Text>
                          </View>
                          <View
                            onClick={() => setCheckInShape('circle')}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg ${
                              checkInShape === 'circle' ? 'bg-gray-100 ring-1 ring-gray-300' : ''
                            }`}
                          >
                            <View
                              className={`w-4 h-4 rounded-full ${checkInShape === 'circle' ? 'bg-gray-500' : 'bg-gray-300'}`}
                            />
                            <Text
                              className={`text-xs font-bold ${checkInShape === 'circle' ? 'text-gray-700' : 'text-gray-400'}`}
                            >
                              圆形
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View className="space-y-1">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                          打卡等级
                        </Text>
                        <View className="flex items-center gap-0.5">
                          {checkInLevels.map((level, idx) => (
                            <Input
                              key={idx}
                              type="number"
                              value={String(level)}
                              onInput={(e) => {
                                const newLevels = [...checkInLevels]
                                newLevels[idx] = Number(e.detail.value) || 1
                                setCheckInLevels(newLevels)
                              }}
                              className="w-9 px-1 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-center text-xs"
                            />
                          ))}
                          <Text className="text-gray-400 text-xs ml-1">次</Text>
                        </View>
                        <Text className="text-[10px] text-gray-300 pl-1">
                          打几次卡加深一个颜色深度
                        </Text>
                      </View>
                    </View>
                  )}
                </>
              )}

              {mode === 'gallery' && (
                <>
                  <View className="space-y-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      主题颜色
                    </Text>
                    <View className="flex items-center gap-1.5 flex-wrap">
                      {DEFAULT_COLORS.map((c) => (
                        <View
                          key={c}
                          onClick={() => setColor(c)}
                          className={`w-7 h-7 rounded-md transition-all flex items-center justify-center ${
                            color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                          }`}
                          style={{ backgroundColor: c }}
                        >
                          {color === c && <Icon icon={Check} size={16} color="#ffffff" strokeWidth={3} />}
                        </View>
                      ))}
                    </View>
                  </View>

                  <View className="space-y-1">
                    <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">
                      图片比例
                    </Text>
                    <View className="flex items-center gap-1.5 flex-wrap">
                      {ASPECT_RATIOS.map((ar) => {
                        const isSelected = aspectRatio === ar.value
                        const scale = 20
                        const maxDim = Math.max(ar.width, ar.height)
                        const w = (ar.width / maxDim) * scale
                        const h = (ar.height / maxDim) * scale
                        return (
                          <View
                            key={ar.value}
                            onClick={() => setAspectRatio(ar.value)}
                            className={`flex flex-col items-center gap-0.5 p-1.5 rounded-lg ${
                              isSelected ? 'bg-gray-100 ring-1 ring-gray-300' : ''
                            }`}
                          >
                            <View
                              className={`border-2 rounded ${isSelected ? 'border-gray-500' : 'border-gray-300'}`}
                              style={{ width: w, height: h }}
                            />
                            <Text
                              className={`text-[10px] font-bold ${isSelected ? 'text-gray-700' : 'text-gray-400'}`}
                            >
                              {ar.label}
                            </Text>
                          </View>
                        )
                      })}
                    </View>
                  </View>
                </>
              )}
            </View>

            <View className="pt-3 flex flex-col gap-1.5">
              <View
                onClick={handleSave}
                className="w-full py-3 bg-gray-800 text-white rounded-xl font-bold shadow-lg text-center text-sm active:scale-[0.98]"
              >
                <Text>{editingProject ? '保存修改' : '创建项目'}</Text>
              </View>

              {editingProject && !showDeleteConfirm && (
                <View
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-1.5 text-red-500 font-bold text-xs text-center"
                >
                  <Text>删除项目</Text>
                </View>
              )}

              {editingProject && showDeleteConfirm && (
                <View className="flex gap-2">
                  <View
                    onClick={() => setShowDeleteConfirm(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold text-xs text-center rounded-lg active:bg-gray-200"
                  >
                    <Text>取消</Text>
                  </View>
                  <View
                    onClick={handleDelete}
                    className="flex-1 py-2 bg-red-500 text-white font-bold text-xs text-center rounded-lg active:opacity-90"
                  >
                    <Text>确认删除</Text>
                  </View>
                </View>
              )}

              <View
                onClick={onClose}
                className="w-full py-2 text-gray-400 font-bold text-xs text-center"
              >
                <Text>取消</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  )
}

export default ProjectModal
