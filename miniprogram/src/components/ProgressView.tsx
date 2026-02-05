import { View, Text, ScrollView } from '@tarojs/components'
import { Project } from '@/types'
import { Icon } from '@/components/Icon'
import { Calendar, Image as ImageIcon } from 'lucide'

interface Props {
  projects: Project[]
  onEdit: (p: Project) => void
  onAdd: () => void
}

const ProgressView: React.FC<Props> = ({ projects, onEdit, onAdd }) => {
  const calculateStats = (project: Project) => {
    if (project.mode === 'gallery') {
      return {
        count: project.photos?.length || 0,
        isGallery: true,
      }
    }
    const totalCheckIns = (Object.values(project.logs) as number[]).reduce(
      (acc, curr) => acc + curr,
      0
    )
    const hoursPerCheckIn = project.hoursPerCheckIn || 1
    const totalHours = totalCheckIns * hoursPerCheckIn
    const progressPercent = Math.min((totalHours / project.goalHours) * 100, 100)
    return { totalHours, progressPercent, isGallery: false }
  }

  const getWashiColor = (color: string) => {
    if (color.startsWith('#')) {
      return color + '40'
    }
    return '#e5e7eb'
  }

  return (
    <View className="flex flex-col h-full overflow-hidden">
      <ScrollView 
        scrollY 
        className="flex-1" 
        style={{ height: '100%' }}
        enhanced
        showScrollbar={false}
      >
        <View className="space-y-6 pb-32 pt-16">
          {projects.map((project) => {
            const stats = calculateStats(project)
            const themeColor = project.colorBase.startsWith('#')
              ? project.colorBase
              : '#3b82f6'

            return (
              <View key={project._id || project.id} className="relative pt-3">
                <View
                  className="absolute -top-0 left-1/2 w-20 h-5 z-20 rounded-sm washi-tape"
                  style={{
                    backgroundColor: getWashiColor(themeColor),
                    transform: 'translateX(-50%)',
                  }}
                />

                <View
                  onClick={() => onEdit(project)}
                  className="w-full text-left grid-paper border border-gray-100 rounded-lg p-4 pt-6 relative card-shadow active:scale-[0.99] transition-transform"
                >
                  <View className="flex items-center gap-3 mb-3">
                    <View
                      className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm shrink-0"
                      style={{ backgroundColor: themeColor }}
                    >
                      <Icon
                        icon={project.mode === 'gallery' ? ImageIcon : Calendar}
                        size={20}
                        color="rgba(255,255,255,0.9)"
                      />
                    </View>

                    <View className="flex-1 flex justify-between items-center min-w-0">
                      <Text className="text-2xl font-bold text-gray-800 truncate">
                        {project.name}
                      </Text>
                      {stats.isGallery ? (
                        <Text className="text-gray-400 text-sm shrink-0 ml-2">
                          {stats.count} 张
                        </Text>
                      ) : (
                        <Text className="text-gray-400 text-sm shrink-0 ml-2">
                          {stats.totalHours?.toLocaleString()}h
                        </Text>
                      )}
                    </View>
                  </View>

                  {project.description && (
                    <Text className="text-sm text-gray-400 mb-3 pl-1 block">
                      {project.description}
                    </Text>
                  )}

                  {!stats.isGallery && (
                    <View className="space-y-1">
                      <View className="w-full h-6 bg-gray-50 rounded-md overflow-hidden border border-gray-100 flex items-center p-1">
                        <View
                          className="h-full rounded-sm transition-all duration-1000 ease-out shadow-sm progress-textured"
                          style={{
                            width: `${stats.progressPercent}%`,
                            backgroundColor: themeColor,
                          }}
                        />
                      </View>
                      <View className="flex justify-end pr-1">
                        <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                          {stats.progressPercent?.toFixed(1)}% 目标进度
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            )
          })}

          <View className="relative pt-3">
            <View
              className="absolute -top-0 left-1/2 w-20 h-5 bg-gray-200 z-20 rounded-sm washi-tape"
              style={{ transform: 'translateX(-50%)' }}
            />

            <View
              onClick={onAdd}
              className="w-full border-2 border-dashed border-gray-200 rounded-lg p-4 pt-6 active:scale-[0.98] transition-transform"
            >
              <View className="flex items-center justify-center gap-2">
                <View className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <Text className="text-xl text-gray-400">+</Text>
                </View>
                <Text className="text-lg text-gray-400">添加计划</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default ProgressView
